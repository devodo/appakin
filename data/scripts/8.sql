-- Table: featured_app

-- DROP TABLE featured_app;

CREATE TABLE featured_app
(
  id serial NOT NULL,
  app_id integer NOT NULL,
  category_id integer NOT NULL,
  weight double precision NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  CONSTRAINT featured_app_pkey PRIMARY KEY (id),
  CONSTRAINT featured_app_app_id_fkey FOREIGN KEY (app_id)
  REFERENCES appstore_app (app_id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT featured_app_category_id_fkey FOREIGN KEY (category_id)
  REFERENCES category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT featured_app_unique UNIQUE (category_id, app_id)
);

-- Table: featured_category

-- DROP TABLE featured_category;

CREATE TABLE featured_category
(
  id serial NOT NULL,
  category_id integer NOT NULL,
  weight double precision NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  CONSTRAINT featured_category_pkey PRIMARY KEY (id),
  CONSTRAINT featured_category_category_id_fkey FOREIGN KEY (category_id)
  REFERENCES category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT featured_category_category_id_key UNIQUE (category_id)
);

