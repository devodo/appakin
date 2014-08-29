CREATE TABLE "user"
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  email text NOT NULL,
  username text,
  firstname text NOT NULL,
  lastname text NOT NULL,
  is_suspended boolean NOT NULL DEFAULT false,
  date_create timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_delete timestamp without time zone,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_ext_id_key UNIQUE (ext_id),
  CONSTRAINT user_username_key UNIQUE (username)
);

create unique index user_email_unique on "user"(lower(email));

CREATE TABLE role
(
  id integer NOT NULL,
  name text NOT NULL,
  CONSTRAINT role_pkey PRIMARY KEY (id)
);

INSERT INTO role(id, name) VALUES (1, 'admin');
INSERT INTO role(id, name) VALUES (2, 'rater');

CREATE TABLE user_role
(
  id serial NOT NULL,
  user_id integer NOT NULL,
  role_id integer NOT NULL,
  CONSTRAINT user_role_pkey PRIMARY KEY (id),
  CONSTRAINT user_role_role_id_fkey FOREIGN KEY (role_id)
  REFERENCES role (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES "user" (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT user_role_unique UNIQUE (user_id, role_id)
);

CREATE TABLE paypal_link
(
  id serial NOT NULL,
  user_id integer NOT NULL,
  account_id text NOT NULL,
  payment_id text NOT NULL,
  account_verified boolean NOT NULL,
  email text NOT NULL,
  email_verified boolean,
  name text NOT NULL,
  given_name text NOT NULL,
  family_name text NOT NULL,
  middle_name text,
  gender character(1),
  birthdate timestamp without time zone,
  zoneinfo text,
  locale text,
  account_type text,
  age_range text,
  phone_number text,
  street_address text,
  locality text,
  region text,
  postal_code text,
  country text,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  CONSTRAINT paypal_link_pkey PRIMARY KEY (id),
  CONSTRAINT paypal_link_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES "user" (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT paypal_link_account_id_unique UNIQUE (account_id)
);

CREATE TABLE store
(
  id integer NOT NULL,
  name text NOT NULL,
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
  title text NOT NULL,
  description text NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp,
  CONSTRAINT category_pkey PRIMARY KEY (id),
  CONSTRAINT category_ext_id_unique UNIQUE (ext_id)
);

create index category_title_unique on category(lower(title));

CREATE TABLE item
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  store_id integer NOT NULL,
  store_item_id text NOT NULL,
  name text NOT NULL,
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
  name text NOT NULL,
  censored_name text,
  description text,
  appstore_url text NOT NULL,
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
);

CREATE TABLE xyo_category
(
  id serial NOT NULL,
  name text NOT NULL,
  link_text text NOT NULL,
  description text NOT NULL,
  url text NOT NULL unique,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT xyo_category_pkey PRIMARY KEY (id)
);

CREATE TABLE xyo_category_app
(
  id serial NOT NULL,
  xyo_category_id integer NOT NULL,
  batch_id integer NOT NULL,
  name text NOT NULL,
  "position" integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT xyo_category_app_pkey PRIMARY KEY (id),
  CONSTRAINT xyo_category_app_xyo_category_id_fkey FOREIGN KEY (xyo_category_id)
  REFERENCES xyo_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT xyo_category_app_unique UNIQUE (batch_id, xyo_category_id, name)
);

CREATE TABLE appstore_popular
(
  id serial NOT NULL,
  batch integer NOT NULL,
  appstore_category_id integer NOT NULL,
  store_app_id text NOT NULL,
  name text NOT NULL,
  position integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT appstore_popular_pkey PRIMARY KEY (id),
  CONSTRAINT appstore_popular_appstore_category_id_fkey FOREIGN KEY (appstore_category_id)
  REFERENCES appstore_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT appstore_popular_app_batch_unique UNIQUE (batch, appstore_category_id, store_app_id)
);

