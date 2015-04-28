
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
