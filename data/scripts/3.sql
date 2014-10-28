CREATE TABLE referral_audit
(
  id serial NOT NULL,
  store_id integer NOT NULL,
  app_id integer NOT NULL,
  category_id integer,
  category_app_id integer,
  ip inet NOT NULL,
  user_id uuid,
  store_url text NOT NULL,
  country_code character varying(2) NOT NULL,
  user_agent text,
  refer text,
  campaign_tracking text,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT referral_audit_pkey PRIMARY KEY (id),
  CONSTRAINT referral_audit_store_id_fkey FOREIGN KEY (store_id)
  REFERENCES store (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
)