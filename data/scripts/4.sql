CREATE TABLE app_analysis
(
  app_id integer NOT NULL,
  english_description double precision NOT NULL,
  description_length integer NOT NULL,
  name_length integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  CONSTRAINT app_analysis_pkey PRIMARY KEY (app_id),
  CONSTRAINT app_analysis_app_id_fkey FOREIGN KEY (app_id)
       REFERENCES app (id) MATCH SIMPLE
       ON UPDATE NO ACTION ON DELETE NO ACTION
);