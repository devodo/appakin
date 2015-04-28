-- Table: appstore_app

-- DROP TABLE appstore_rating;

CREATE TABLE appstore_rating
(
  id bigserial primary key,
  app_id integer references appstore_app (app_id) NOT NULL,
  country_code char(3) NOT NULL,
  user_rating_current numeric(3,2),
  rating_count_current integer,
  user_rating numeric(3,2),
  rating_count integer,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT appstore_rating_country_code_app_id_unique UNIQUE (country_code, app_id)
);

CREATE TABLE appstore_rating_history
(
  id bigserial primary key,
  app_id integer references appstore_app (app_id) NOT NULL,
  country_code char(3) NOT NULL,
  user_rating_current numeric(3,2),
  rating_count_current integer,
  user_rating numeric(3,2),
  rating_count integer,
  date_created timestamp without time zone NOT NULL
);

CREATE TABLE appstore_price
(
  id bigserial primary key,
  app_id integer references appstore_app (app_id) NOT NULL,
  country_code char(3) NOT NULL,
  price numeric(8,3) NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT appstore_price_country_code_app_id_unique UNIQUE (country_code, app_id)
);

CREATE TABLE appstore_price_history
(
  id bigserial primary key,
  app_id integer references appstore_app (app_id) NOT NULL,
  country_code char(3) NOT NULL,
  price numeric(8,3) NOT NULL,
  date_created timestamp without time zone NOT NULL
);

CREATE TABLE appstore_version_history
(
  id bigserial primary key,
  app_id integer references appstore_app (app_id) NOT NULL,
  version text NOT NULL,
  itunes_version text NOT NULL,
  date_created timestamp without time zone NOT NULL
);


INSERT INTO appstore_price(app_id, country_code, price, date_created, date_modified)
  select app_id, 'USA', price::double precision / 100, now() at time zone 'utc', now() at time zone 'utc'
  from appstore_app;

insert into appstore_price_history(app_id, country_code, price, date_created)
  select app_id, country_code, price, date_created
  from appstore_price;


INSERT INTO appstore_rating(app_id, country_code, user_rating_current, rating_count_current,
                            user_rating, rating_count, date_created, date_modified)
  select app_id, 'USA', user_rating_current::double precision, rating_count_current,
    user_rating::double precision, rating_count, now() at time zone 'utc', now() at time zone 'utc'
  from appstore_app;

INSERT INTO appstore_rating_history(app_id, country_code, user_rating_current, rating_count_current,
                                    user_rating, rating_count, date_created)
  select app_id, country_code, user_rating_current, rating_count_current,
    user_rating, rating_count, date_created
  from appstore_rating;

alter table appstore_app add column checksum text;
alter table appstore_app add column copyright text;
alter table appstore_app add column itunes_version text;
alter table appstore_app add column screenshot_dimensions text[];
alter table appstore_app add column ipad_screenshot_dimensions text[];

alter table appstore_app alter column bundle_id drop not null;
alter table appstore_app alter column is_free drop not null;
alter table appstore_app alter column artwork_medium_url drop not null;
alter table appstore_app alter column price drop not null;
alter table appstore_app alter column currency drop not null;
alter table appstore_app alter column is_game_center_enabled drop not null;

select max(app_id) + 1 from appstore_app;
CREATE SEQUENCE appstore_app_app_id_seq START 1204398;
alter table appstore_app alter column app_id set default nextval('appstore_app_app_id_seq');
alter sequence appstore_app_app_id_seq OWNED BY appstore_app.app_id;

alter table app_analysis drop constraint app_analysis_app_id_fkey;
alter table app_analysis ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table app_popularity drop constraint app_popularity_app_id_fkey;
alter table app_popularity ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table appstore_app drop constraint appstore_app_app_id_fkey;
alter table appstore_app ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table category_app drop constraint category_app_app_id_fkey;
alter table category_app ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table category_app_exclude drop constraint category_app_exclude_app_id_fkey;
alter table category_app_exclude ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table seed_category_app drop constraint seed_category_app_app_id_fkey;
alter table seed_category_app ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table app_ambiguity drop constraint app_ambiguity_app_id_fkey;
alter table app_ambiguity ADD FOREIGN KEY (app_id) REFERENCES appstore_app (app_id);

alter table rating drop constraint rating_item_id_fkey;

drop table app;


CREATE OR REPLACE FUNCTION create_or_update_appstore_app(
  store_app_id text, advisory_rating text, seller_name text, store_url text,
  artwork_large_url text, artwork_small_url text, release_date timestamp without time zone,
  copyright text, version text, itunes_version text, file_size_bytes text,
  name text, description text, release_notes text,
  screenshot_urls text[], screenshot_dimensions text[], ipad_screenshot_urls text[], ipad_screenshot_dimensions text[],
  dev_name text, dev_id integer, dev_url text, genres text[], language_codes text[], supported_devices text[],
  checksum text, is_iphone boolean, is_ipad boolean)
  RETURNS integer AS
  $BODY$
  DECLARE
    current_checksum text;
    new_ext_id uuid;
    app_id integer;
  BEGIN
    RAISE NOTICE 'Creating or updating app %', name;

    SELECT a.app_id, a.checksum INTO app_id, current_checksum
    FROM appstore_app a
    WHERE a.store_app_id = store_app_id;

    IF NOT FOUND THEN
      RAISE NOTICE 'Inserting new app %', name;

      new_ext_id := uuid_generate_v4();

      INSERT INTO app(ext_id, store_id, name, date_created, date_modified)
      VALUES (new_ext_id, 1, name, now() at time zone 'utc', now() at time zone 'utc')
      RETURNING id INTO app_id;

      INSERT INTO appstore_app(
        app_id, ext_id, store_app_id, name, description,
        store_url, dev_id, dev_name, dev_url, supported_devices,
        screenshot_urls, screenshot_dimensions, ipad_screenshot_urls, ipad_screenshot_dimensions,
        artwork_small_url, artwork_large_url,
        version, itunes_version, primary_genre, genres, release_date,
        seller_name, release_notes, language_codes, file_size_bytes,
        advisory_rating, is_iphone, is_ipad, checksum, date_created, date_modified)
      VALUES (new_id, new_ext_id, store_app_id, name, description,
              store_url, dev_id, dev_name, dev_url, supported_devices,
              screenshot_urls, screenshot_dimensions, ipad_screenshot_urls, ipad_screenshot_dimensions,
              artwork_small_url, artwork_large_url,
              version, itunes_version, genres[1], genres, release_date,
              seller_name, release_notes, language_codes, file_size_bytes,
              advisory_rating, is_iphone, is_ipad, checksum,
              now() at time zone 'utc', now() at time zone 'utc');

    ELSIF current_checksum != checksum THEN
      RAISE NOTICE 'Updating app %', name;

      update appstore_app a
      set
        a.name = name,
        a.description = description,
        a.store_url = store_url,
        a.dev_id = dev_id,
        a.dev_name = dev_name,
        a.dev_url = dev_url,
        a.supported_devices = supported_devices,
        a.screenshot_urls = screenshot_urls,
        a.screenshot_dimensions = screenshot_dimensions,
        a.ipad_screenshot_urls = ipad_screenshot_urls,
        a.ipad_screenshot_dimensions = ipad_screenshot_dimensions,
        a.artwork_small_url = artwork_small_url,
        a.artwork_large_url = artwork_large_url,
        a.version = version,
        a.itunes_version = itunes_version,
        a.primary_genre = genres[1],
        a.genres = genres,
        a.release_date = release_date,
        a.seller_name = seller_name,
        a.release_notes = release_notes,
        a.language_codes = language_codes,
        a.file_size_bytes = file_size_bytes,
        a.advisory_rating = advisory_rating,
        a.is_iphone = is_iphone,
        a.is_ipad = is_ipad,
        a.checksum = checksum,
        a.date_modified = now() at time zone 'utc'
      where a.store_app_id = store_app_id;
    END IF;

    RETURN app_id;
  END;
  $BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
