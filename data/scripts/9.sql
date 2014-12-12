alter table app_analysis add column desc_md5_checksum text NULL;
alter table app_analysis add column desc_cleaned text NULL;

CREATE TABLE appstore_refresh_audit
(
  id serial NOT NULL,
  last_id integer NOT NULL,
  is_success boolean NOT NULL,
  error_message text,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT appstore_refresh_audit_pkey PRIMARY KEY (id)
);

CREATE INDEX appstore_refresh_audit_id_index ON appstore_refresh_audit (id desc)
WHERE is_success;
