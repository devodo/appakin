
-- Insert new apps and init their version history
WITH app_new AS (
	INSERT INTO appstore_app(
		    ext_id, store_app_id, name, description,
		    store_url, dev_id, dev_name, dev_url, supported_devices,
		    screenshot_urls, screenshot_dimensions, ipad_screenshot_urls, ipad_screenshot_dimensions,
		    artwork_small_url, artwork_large_url,
		    version, itunes_version, primary_genre, genres, release_date,
		    seller_name, release_notes, language_codes, file_size_bytes,
		    advisory_rating, is_iphone, is_ipad,
		    copyright, checksum, date_created, date_modified)
	SELECT uuid_generate_v4(), ai.store_app_id, ai.name, ai.description, ai.store_url, ai.dev_id, ai.dev_name,
	       ai.dev_url, ai.supported_devices, ai.screenshot_urls, ai.screenshot_dimensions,
	       ai.ipad_screenshot_urls, ai.ipad_screenshot_dimensions, ai.artwork_small_url,
	       ai.artwork_large_url, ai.version, ai.itunes_version, ai.genres[1], ai.genres, ai.release_date,
	       ai.seller_name, ai.release_notes, ai.language_codes, ai.file_size_bytes,
	       ai.advisory_rating,
	       position('iphone' in lower(array_to_string(ai.supported_devices,'',''))) > 0,
	       position('ipad' in lower(array_to_string(ai.supported_devices,'',''))) > 0,
	       ai.copyright, ai.checksum,
	       now() at time zone 'utc', now() at time zone 'utc'
	FROM appstore_app_import ai
	LEFT JOIN appstore_app a on ai.store_app_id = a.store_app_id
	WHERE a.app_id is null
	RETURNING app_id
)
INSERT INTO appstore_version_history(app_id, version, itunes_version, date_created)
select a.app_id, a.version, a.itunes_version, a.release_date
from appstore_app a
join app_new an on a.app_id = an.app_id;

-- Insert version changes into the history table
INSERT INTO appstore_version_history(app_id, version, itunes_version, date_created)
select a.app_id, ai.version, ai.itunes_version, now() at time zone 'utc'
from appstore_app a
join appstore_app_import ai on a.store_app_id = ai.store_app_id
and (a.version != ai.version or a.version is null);

-- Update apps
update appstore_app a
set
    name = ai.name,
    description = ai.description,
    store_url = ai.store_url,
    dev_id = ai.dev_id,
    dev_name = ai.dev_name,
    dev_url = ai.dev_url,
    supported_devices = ai.supported_devices,
    screenshot_urls = ai.screenshot_urls,
    screenshot_dimensions = ai.screenshot_dimensions,
    ipad_screenshot_urls = ai.ipad_screenshot_urls,
    ipad_screenshot_dimensions = ai.ipad_screenshot_dimensions,
    artwork_small_url = ai.artwork_small_url,
    artwork_large_url = ai.artwork_large_url,
    version = ai.version,
    itunes_version = ai.itunes_version,
    primary_genre = ai.genres[1],
    genres = ai.genres,
    release_date = ai.release_date,
    seller_name = ai.seller_name,
    release_notes = ai.release_notes,
    language_codes = ai.language_codes,
    file_size_bytes = ai.file_size_bytes,
    advisory_rating = ai.advisory_rating,
    is_iphone = position('iphone' in lower(array_to_string(ai.supported_devices,'',''))) > 0,
    is_ipad = position('ipad' in lower(array_to_string(ai.supported_devices,'',''))) > 0,
    copyright = ai.copyright,
    checksum = ai.checksum,
    date_modified = now() at time zone 'utc',
    date_deleted = null
from appstore_app_import ai
where a.store_app_id = ai.store_app_id
and (a.checksum != ai.checksum or a.checksum is null);

-- Delete apps
update appstore_app a
set
    date_deleted = now() at time zone 'utc'
from (
	select a.app_id
	from appstore_app a
	left join appstore_app_import ai
	on a.store_app_id = ai.store_app_id
	where ai.store_app_id is null
) a_del
where a.app_id = a_del.app_id;

-- Run this only once on deployment to init the version history table
INSERT INTO appstore_version_history(app_id, version, itunes_version, date_created)
  select a.app_id, a.version, a.itunes_version, a.release_date
  from appstore_app a
  where a.date_deleted is null;