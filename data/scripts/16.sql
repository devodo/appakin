CREATE OR REPLACE FUNCTION refresh_appstore_app(
  _store_app_id text, _country_code character, _name text, _censored_name text,
  _features text[], _is_game_center_enabled boolean,
  _bundle_id text, _min_os_version text, _content_rating text,
  _user_rating_current numeric, _rating_count_current integer,
  _user_rating numeric, _rating_count integer, _price numeric(8,3))
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
        coalesce(a.name,'') != coalesce(_name,'') OR
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
	set 	name = _name,
		censored_name = _censored_name,
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

    WITH price_update AS (
	UPDATE appstore_price
	SET price = _price, date_modified = _date_now
	WHERE app_id = _app_id
	AND country_code = _country_code
	AND price != _price
	RETURNING app_id
    )
    INSERT INTO appstore_price_history(app_id, country_code, price, date_created)
    SELECT app_id, _country_code, _price, _date_now FROM price_update;

    RETURN _rating_changed;
  END;
  $BODY$
LANGUAGE plpgsql VOLATILE
COST 100;