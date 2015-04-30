COPY (
SELECT
  application_id,
  title,
  description,
  view_url,
  dev_id,
  dev_name,
  dev_url,
  supported_devices,
  screenshot_urls,
  screenshot_dimensions,
  ipad_screenshot_urls,
  ipad_screenshot_dimensions,
  artwork_url_small,
  artwork_url_large,
  version,
  itunes_version,
  genres,
  itunes_release_date,
  seller_name,
  release_notes,
  language_codes,
  download_size,
  advisory_rating,
  copyright,
  md5(
      coalesce(advisory_rating, '') || coalesce(artwork_url_large, '') || coalesce(artwork_url_small, '') ||
      coalesce(copyright, '') || coalesce(version, '') || coalesce(itunes_version, '') || coalesce(download_size, 0) ||
      coalesce(title, '') || coalesce(description, '') || coalesce(release_notes, '') ||
      coalesce(array_to_string(screenshot_urls, ',', '-'), '') ||
      coalesce(array_to_string(ipad_screenshot_urls, ',', '-'), '') ||
      coalesce(array_to_string(genres, ',', '-'), '') ||
      coalesce(array_to_string(language_codes, ',', '-'), '') ||
      coalesce(array_to_string(supported_devices, ',', '-'), '')) AS checksum
FROM (
       SELECT
         a.application_id,
         a.recommended_age AS advisory_rating,
         a.seller_name,
         a.view_url,
         a.artwork_url_large,
         a.artwork_url_small,
         a.itunes_release_date,
         a.copyright,
         a.version,
         a.itunes_version,
         a.download_size,

         CASE WHEN ad.language_code = 'EN'
           THEN ad.title
         ELSE a.title
         END,

         CASE WHEN ad.language_code = 'EN'
           THEN ad.description
         ELSE a.description
         END,

         ad.release_notes,

         ARRAY [ad.screenshot_url_1, ad.screenshot_url_2, ad.screenshot_url_3, ad.screenshot_url_4] AS screenshot_urls,
         ARRAY [ad.screenshot_width_height_1, ad.screenshot_width_height_2, ad.screenshot_width_height_3, ad.screenshot_width_height_4] AS screenshot_dimensions,
         ARRAY [ad.ipad_screenshot_url_1, ad.ipad_screenshot_url_2, ad.ipad_screenshot_url_3, ad.ipad_screenshot_url_4] AS ipad_screenshot_urls,
         ARRAY [ad.ipad_screenshot_width_height_1, ad.ipad_screenshot_width_height_2, ad.ipad_screenshot_width_height_3, ad.ipad_screenshot_width_height_4] AS ipad_screenshot_dimensions,

         artist.name AS dev_name,
         artist.artist_id AS dev_id,
         artist.view_url AS dev_url,

         ARRAY(
             SELECT g.name
             FROM epf_genre_application ga
               JOIN epf_genre g ON ga.genre_id = g.genre_id
             WHERE ga.application_id = a.application_id
             ORDER BY ga.is_primary DESC) AS genres,

         ARRAY(
             SELECT language_code
             FROM epf_application_detail ad1
             WHERE ad1.application_id = a.application_id) AS language_codes,

         ARRAY(
             SELECT dt.name
             FROM epf_application_device_type adt
               JOIN epf_device_type dt ON adt.device_type_id = dt.device_type_id
             WHERE adt.application_id = a.application_id) AS supported_devices
       FROM epf_application a
         JOIN LATERAL (
              SELECT artist.*
              FROM epf_artist_application aa
                JOIN epf_artist artist ON aa.artist_id = artist.artist_id
              WHERE aa.application_id = a.application_id
              ORDER BY aa.export_date DESC
              LIMIT 1
              ) artist ON TRUE
         JOIN LATERAL (
              SELECT *
              FROM epf_application_detail ad
              WHERE ad.application_id = a.application_id
              ORDER BY ad.language_code = 'EN' DESC, ad.export_date DESC
              LIMIT 1
              ) ad ON TRUE
     ) t
LIMIT 10
) TO STDOUT;


CREATE INDEX epf_artist_application_idx
ON epf_artist_application
USING btree
(application_id);