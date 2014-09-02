alter table item rename to app;
alter table app rename column store_item_id to store_app_id;
alter sequence item_id_seq rename to app_id_seq;
alter index item_pkey rename to app_pkey;
alter index item_ext_id_unique rename to app_ext_id_unique;
alter index item_store_item_id_unique rename to app_store_app_id_unique;
alter table app drop constraint item_store_id_fkey;
alter table app add foreign key (store_id) references store(id);

alter table appstore_item rename to appstore_app;
alter table appstore_app rename column item_id to app_id;
alter index appstore_item_pkey rename to appstore_app_pkey;
alter table appstore_app drop constraint appstore_item_item_id_fkey;
alter table appstore_app add foreign key (app_id) references app(id);


alter table appstore_item_src rename to appstore_app_src;
alter sequence appstore_item_src_id_seq rename to appstore_app_src_id_seq;
alter table appstore_app_src rename column appstore_id to store_app_id;
alter index appstore_item_src_pkey rename to appstore_app_src_pkey;
alter index appstore_item_src_appstore_id_key rename to appstore_app_src_store_app_id_key;
alter table appstore_app_src drop constraint appstore_item_src_appstore_category_id_fkey;
alter table appstore_app_src add foreign key (appstore_category_id) references appstore_category(id);

alter table appstore_category rename column appstore_id to store_category_id;
alter index appstore_category_appstore_id_key rename to appstore_category_store_category_id_key;

CREATE TABLE appstore_app_new
(
  app_id integer NOT NULL,
  store_app_id text NOT NULL,
  name text,
  censored_name text,
  description text,
  store_url text NOT NULL,
  dev_id integer NOT NULL,
  dev_name text NOT NULL,
  dev_url text,
  features text[],
  supported_devices text[] NOT NULL,
  is_game_center_enabled boolean NOT NULL,
  screenshot_urls text[],
  ipad_screenshot_urls text[],
  artwork_small_url text NOT NULL,
  artwork_medium_url text NOT NULL,
  artwork_large_url text NOT NULL,
  price integer NOT NULL,
  currency text NOT NULL,
  version text,
  primary_genre text NOT NULL,
  genres text[] NOT NULL,
  release_date timestamp without time zone NOT NULL,
  bundle_id text NOT NULL,
  seller_name text,
  release_notes text,
  min_os_version text,
  language_codes character(2)[],
  file_size_bytes text,
  advisory_rating text,
  content_rating text,
  user_rating_current text,
  rating_count_current integer,
  user_rating text,
  rating_count integer,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL
);

INSERT INTO appstore_app_new(
  app_id, store_app_id, name, censored_name, description, store_url,
  dev_id, dev_name, dev_url, features, supported_devices, is_game_center_enabled,
  screenshot_urls, ipad_screenshot_urls, artwork_small_url, artwork_medium_url,
  artwork_large_url, price, currency, version, primary_genre, genres,
  release_date, bundle_id, seller_name, release_notes, min_os_version,
  language_codes, file_size_bytes, advisory_rating, content_rating,
  user_rating_current, rating_count_current, user_rating, rating_count,
  date_created, date_modified)
  SELECT app_id, a.store_app_id, asa.name, censored_name, description, appstore_url, dev_id,
    dev_name, dev_url, features, supported_devices, is_game_center_enabled,
    screenshot_urls, ipad_screenshot_urls, artwork_small_url, artwork_medium_url,
    artwork_large_url, price, currency, version, primary_genre, genres,
    release_date, bundle_id, seller_name, release_notes, min_os_version,
    language_codes, file_size_bytes, advisory_rating, content_rating,
    user_rating_current, rating_count_current, user_rating, rating_count,
    asa.date_created, asa.date_modified
  FROM appstore_app asa
    join app a on asa.app_id = a.id;

drop table appstore_app;
alter table appstore_app_new rename to appstore_app;
alter table appstore_app add primary key (app_id);
alter table appstore_app add foreign key (app_id) references app(id);
alter table app drop column store_app_id;

alter table category drop column store_id;

ALTER TABLE appstore_app ADD CONSTRAINT appstore_app_store_app_id_unique UNIQUE (store_app_id);

CREATE TABLE category_app
(
  id serial NOT NULL,
  category_id integer NOT NULL,
  app_id integer NOT NULL,
  "position" integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT category_app_pkey PRIMARY KEY (id),
  CONSTRAINT category_app_app_id_fkey FOREIGN KEY (app_id)
  REFERENCES app (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT category_app_category_id_fkey FOREIGN KEY (category_id)
  REFERENCES category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT category_app_unique UNIQUE (category_id, app_id)
);

