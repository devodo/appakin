
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
where a.app_id = a_del.app_id
and a.date_deleted is null;

-- Run this only once on deployment to init the version history table
INSERT INTO appstore_version_history(app_id, version, itunes_version, date_created)
  select a.app_id, a.version, a.itunes_version, a.release_date
  from appstore_app a
  where a.date_deleted is null;




-- Import new prices
WITH price_new AS (
	INSERT INTO appstore_price(app_id, country_code, price, date_created, date_modified)
	select a.app_id, pi.country_code, pi.price, now() at time zone 'utc', now() at time zone 'utc'
	from appstore_app a
	join appstore_price_import pi on a.store_app_id = pi.store_app_id
	left join appstore_price p
		on a.app_id = p.app_id
		and pi.country_code = p.country_code
	where p.price is null
	returning app_id, country_code, price, date_created
)
INSERT INTO appstore_price_history(app_id, country_code, price, date_created)
SELECT app_id, country_code, price, date_created
FROM price_new;


-- Update changed prices
WITH price_change AS (
	INSERT INTO appstore_price_history(app_id, country_code, price, date_created)
	select a.app_id, pi.country_code, pi.price, now() at time zone 'utc'
	from appstore_app a
	join appstore_price_import pi on a.store_app_id = pi.store_app_id
	join appstore_price p
		on a.app_id = p.app_id
		and pi.country_code = p.country_code
	where p.price != pi.price
	returning app_id, country_code, price, date_created
)
UPDATE appstore_price ap
   SET price = pc.price,
   date_modified = pc.date_created,
	 date_deleted = null
FROM price_change pc
WHERE ap.app_id = pc.app_id
AND ap.country_code = pc.country_code;

-- Delete removed prices
update appstore_price p
set
    date_deleted = now() at time zone 'utc'
from (
	select p.id
	from appstore_price p
	join appstore_app a on p.app_id = a.app_id
	left join appstore_price_import pi
	on a.store_app_id = pi.store_app_id
	and p.country_code = pi.country_code
	where pi.store_app_id is null
) p_del
where p.id = p_del.id
and p.date_deleted is null;


-- Update analysis checksums
update app_analysis aa
set desc_md5_checksum = a.checksum
from appstore_app a
where aa.app_id = a.app_id
and aa.desc_md5_checksum = md5(coalesce(a.description,'') || coalesce(array_to_string(a.language_codes,',',''), ''));



CREATE OR REPLACE FUNCTION refresh_appstore_app(_store_app_id text, _country_code char(3), _censored_name text,
						 _features text[], _is_game_center_enabled boolean,
						 _bundle_id text, _min_os_version text, _content_rating text,
						 _user_rating_current numeric(3,2), _rating_count_current integer,
						 _user_rating numeric(3,2), _rating_count integer)
  RETURNS boolean AS
$BODY$
  DECLARE
    _app_id integer;
    _rating_changed boolean;
    _date_now timestamp without time zone;
  BEGIN
    RAISE NOTICE 'Refreshing app store app %', _store_app_id;

    SELECT a.app_id INTO _app_id
    FROM appstore_app a
    WHERE a.store_app_id = _store_app_id;

    _date_now := now() at time zone 'utc';

    IF EXISTS (
      SELECT 1
      FROM appstore_app a
      WHERE a.app_id = _app_id
      AND (
        coalesce(a.censored_name,'') != coalesce(_censored_name,'') OR
        coalesce(array_to_string(a.features,',', 'null'),'') != coalesce(array_to_string(_features,',', 'null'),'') OR
        coalesce(a.is_game_center_enabled != _is_game_center_enabled, false) OR
        (a.is_game_center_enabled is null AND _is_game_center_enabled is not null) OR
        coalesce(a.bundle_id,'') != coalesce(_bundle_id,'') OR
        coalesce(a.min_os_version,'') != coalesce(_min_os_version,'') OR
        coalesce(a.content_rating,'') != coalesce(_content_rating,'')
      )
    ) THEN
        RAISE NOTICE 'Updating app store app %', _app_id;

	update appstore_app a
	set 	censored_name = _censored_name,
		features = _features,
		is_game_center_enabled = _is_game_center_enabled,
		bundle_id = _bundle_id,
		min_os_version = _min_os_version,
		content_rating = _content_rating,
		date_modified = _date_now
	where a.app_id = _app_id;
    END IF;

    _rating_changed := false;

    IF NOT EXISTS (
      SELECT 1
      FROM appstore_rating r
      WHERE r.app_id = _app_id
      AND r.country_code = _country_code
    ) THEN
      RAISE NOTICE 'Inserting new app store rating %', _app_id;

      _rating_changed := true;

      INSERT INTO appstore_rating(app_id, country_code,
				   user_rating_current, rating_count_current, user_rating, rating_count,
				   date_created, date_modified)
      VALUES (_app_id, _country_code,
	      _user_rating_current, _rating_count_current, _user_rating, _rating_count,
	      _date_now, _date_now);
    ELSEIF EXISTS (
      SELECT 1
      FROM appstore_rating r
      WHERE r.app_id = _app_id
      AND r.country_code = _country_code
      AND (
	coalesce(r.user_rating_current != _user_rating_current, false) OR
	(r.user_rating_current is null AND _user_rating_current is not null) OR
	coalesce(r.rating_count_current != _rating_count_current, false) OR
	(r.rating_count_current is null AND _rating_count_current is not null) OR
	coalesce(r.user_rating != _user_rating, false) OR
	(r.user_rating is null AND _user_rating is not null) OR
	coalesce(r.rating_count != _rating_count, false) OR
	(r.rating_count is null AND _rating_count is not null)
      )
    ) THEN
      RAISE NOTICE 'Updating app store rating %', _app_id;

      _rating_changed := true;

      update appstore_rating r
      set 	user_rating_current = _user_rating_current,
		rating_count_current = _rating_count_current,
		user_rating = _user_rating,
		rating_count = _rating_count,
		date_modified = _date_now
      where r.app_id = _app_id
      and r.country_code = _country_code;
    END IF;

    IF _rating_changed THEN
      RAISE NOTICE 'Inserting app store rating history %', _app_id;

      INSERT INTO appstore_rating_history(app_id, country_code,
				           user_rating_current, rating_count_current,
				           user_rating, rating_count, date_created)
      VALUES (_app_id, _country_code,
	      _user_rating_current, _rating_count_current, _user_rating, _rating_count,
	      _date_now);
    END IF;

    RETURN _rating_changed;

  END;
  $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;





