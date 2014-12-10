CREATE TABLE featured_app_type
(
  id integer primary key,
  name text not null,
  description text,
  date_created timestamp without time zone NOT NULL
);

INSERT INTO featured_app_type(id, name, description, date_created)
VALUES (1, 'Fresh and Popular', null, NOW() at time zone 'utc');

INSERT INTO featured_app_type(id, name, description, date_created)
VALUES (2, 'Sponsored', null, NOW() at time zone 'utc');

INSERT INTO featured_app_type(id, name, description, date_created)
VALUES (3, 'Promoted', null, NOW() at time zone 'utc');

INSERT INTO featured_app_type(id, name, description, date_created)
VALUES (4, 'Internal', null, NOW() at time zone 'utc');

INSERT INTO featured_app_type(id, name, description, date_created)
VALUES (5, 'Rising Star', null, NOW() at time zone 'utc');

CREATE TABLE featured_homepage_app
(
  id serial primary key,
  app_id integer NOT NULL references appstore_app (app_id),
  category_id integer NOT NULL references category (id),
  weight double precision NOT NULL,
  fixed_order integer,
  featured_app_type integer NOT NULL references featured_app_type(id),
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  CONSTRAINT featured_homepage_app_unique UNIQUE (category_id, app_id)
);

CREATE TABLE featured_category_app
(
  id serial primary key,
  app_id integer NOT NULL references appstore_app (app_id),
  category_id integer NOT NULL references category (id),
  weight double precision NOT NULL,
  fixed_order integer,
  featured_app_type integer NOT NULL references featured_app_type(id),
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  CONSTRAINT featured_category_app_unique UNIQUE (category_id, app_id)
);


CREATE TABLE featured_homepage_category
(
  id serial PRIMARY KEY,
  category_id integer NOT NULL references category (id) unique,
  weight double precision NOT NULL,
  fixed_order integer,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  start_date timestamp without time zone,
  end_date timestamp without time zone
);


