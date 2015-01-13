CREATE TABLE appstore_src_refresh_audit
(
  id serial NOT NULL,
  appstore_category_id integer NOT NULL,
  letter character(1) NOT NULL,
  is_success boolean NOT NULL,
  new_apps integer,
  error_message text,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT appstore_src_refresh_audit_pkey PRIMARY KEY (id),
  CONSTRAINT appstore_src_refresh_audit_appstore_category_id_fkey FOREIGN KEY (appstore_category_id)
  REFERENCES appstore_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX appstore_src_refresh_audit_id_index
ON appstore_src_refresh_audit
USING btree
(id DESC)
  WHERE is_success;

