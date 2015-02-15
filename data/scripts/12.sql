CREATE TABLE app_ambiguity
(
	app_id integer NOT NULL,
	is_dev_ambiguous boolean NOT NULL,
	is_global_ambiguous boolean NOT NULL,
	use_short_name boolean NOT NULL,
	include_dev_name boolean NOT NULL,
	global_total integer NOT NULL,
	dev_total integer NOT NULL,
	top_app_ext_id uuid,
	exclude_terms text[],
	error_msg text,
	date_created timestamp without time zone NOT NULL,
	date_modified timestamp without time zone NOT NULL,
	CONSTRAINT app_ambiguity_pkey PRIMARY KEY (app_id),
	CONSTRAINT app_ambiguity_app_id_fkey FOREIGN KEY (app_id)
	REFERENCES app (id) MATCH SIMPLE
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT app_ambiguity_top_app_ext_id_fkey FOREIGN KEY (top_app_ext_id)
	REFERENCES appstore_app (ext_id) MATCH SIMPLE
	ON UPDATE NO ACTION ON DELETE NO ACTION
);