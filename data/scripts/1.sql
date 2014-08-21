CREATE TABLE "user"
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  email character varying(320) NOT NULL,
  email_lower character varying(320) NOT NULL,
  username character varying(64),
  firstname character varying(64) NOT NULL,
  lastname character varying(64) NOT NULL,
  date_create timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_email_lower_key UNIQUE (email_lower),
  CONSTRAINT user_ext_id_key UNIQUE (ext_id),
  CONSTRAINT user_username_key UNIQUE (username)
);

CREATE TABLE paypal_link
(
  id serial NOT NULL,
  user_id integer NOT NULL,
  account_id character varying(64) NOT NULL,
  payment_id character varying(64) NOT NULL,
  account_verified boolean NOT NULL,
  email character varying(320) NOT NULL,
  email_verified boolean,
  name character varying(256) NOT NULL,
  given_name character varying(64) NOT NULL,
  family_name character varying(64) NOT NULL,
  middle_name character varying(64),
  gender character varying(6),
  birthdate timestamp without time zone,
  zoneinfo character varying(64),
  locale character varying(64),
  account_type character varying(8),
  age_range character varying(32),
  phone_number character varying(64),
  street_address character varying(64),
  locality character varying(64),
  region character varying(64),
  postal_code character varying(32),
  country character varying(64),
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT paypal_link_pkey PRIMARY KEY (id),
  CONSTRAINT paypal_link_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES "user" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT paypal_link_account_id_unique UNIQUE (account_id)
);

CREATE TABLE store
(
  id integer NOT NULL,
  name character varying(256) NOT NULL,
  description text,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT store_pkey PRIMARY KEY (id)
);

INSERT INTO store(id, name, description, date_created, date_modified)
VALUES (1, 'App Store', 'Apple iTunes App Store', NOW(), NOW());

CREATE TABLE category
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  store_id integer NOT NULL,
  title character varying(512) NOT NULL,
  alt_title character varying(512)[],
  summary text NOT NULL,
  description text NOT NULL,
  keyword character varying(65)[],
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT category_pkey PRIMARY KEY (id),
  CONSTRAINT category_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES store (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT category_ext_id_unique UNIQUE (ext_id)
);

CREATE TABLE item
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  store_id integer NOT NULL,
  store_item_id character varying(64) NOT NULL,
  name character varying(256) NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT item_pkey PRIMARY KEY (id),
  CONSTRAINT item_store_id_fkey FOREIGN KEY (store_id)
  REFERENCES store (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT item_ext_id_unique UNIQUE (ext_id),
  CONSTRAINT item_store_item_id_unique UNIQUE (store_id, store_item_id)
);

CREATE TABLE rating
(
  id bigserial NOT NULL,
  category_id integer NOT NULL,
  item_id integer NOT NULL,
  user_id integer NOT NULL,
  value integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  CONSTRAINT rating_pkey PRIMARY KEY (id),
  CONSTRAINT rating_category_id_fkey FOREIGN KEY (category_id)
      REFERENCES category (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT rating_item_id_fkey FOREIGN KEY (item_id)
      REFERENCES item (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT rating_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES "user" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE appstore_item
(
  item_id integer NOT NULL,
  name character varying(256) NOT NULL,
  censored_name character varying(256),
  description text NOT NULL,
  appstore_url character varying(256) NOT NULL,
  dev_id integer NOT NULL,
  dev_name character varying(64) NOT NULL,
  dev_url character varying(256),
  features character varying(64)[],
  supported_devices character varying(64)[] NOT NULL,
  is_game_center_enabled boolean NOT NULL,
  screenshot_urls character varying(256)[],
  ipad_screenshot_urls character varying(256)[],
  artwork_small_url character varying(256) NOT NULL,
  artwork_medium_url character varying(256) NOT NULL,
  artwork_large_url character varying(256) NOT NULL,
  price integer NOT NULL,
  currency character varying(5) NOT NULL,
  version character varying(32),
  primary_genre character varying(64) NOT NULL,
  genres character varying(64)[] NOT NULL,
  release_date timestamp without time zone NOT NULL,
  bundle_id character varying(256) NOT NULL,
  seller_name character varying(256),
  release_notes text,
  min_os_version character varying(10),
  language_codes character(2)[],
  file_size_bytes character varying(64),
  advisory_rating character varying(12),
  content_rating character varying(12),
  user_rating_current character varying(10),
  rating_count_current integer,
  user_rating character varying(10),
  rating_count integer,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT appstore_item_pkey PRIMARY KEY (item_id),
  CONSTRAINT appstore_item_item_id_fkey FOREIGN KEY (item_id)
  REFERENCES item (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE appstore_category
(
  id serial NOT NULL,
  appstore_id character varying(32) NOT NULL,
  name character varying(64) NOT NULL,
  store_url character varying(256) NOT NULL,
  parent_id integer,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT appstore_category_pkey PRIMARY KEY (id),
  CONSTRAINT appstore_category_parent_id_fkey FOREIGN KEY (parent_id)
  REFERENCES appstore_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT appstore_category_appstore_id_key UNIQUE (appstore_id)
);

CREATE TABLE appstore_item_src
(
  id serial NOT NULL,
  appstore_category_id integer NOT NULL,
  appstore_id character varying(64) NOT NULL,
  name character varying(512) NOT NULL,
  letter character(1) NOT NULL,
  page_number integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT appstore_item_src_pkey PRIMARY KEY (id),
  CONSTRAINT appstore_item_src_appstore_category_id_fkey FOREIGN KEY (appstore_category_id)
  REFERENCES appstore_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT appstore_item_src_appstore_id_key UNIQUE (appstore_id)
)

