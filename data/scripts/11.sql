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



CREATE OR REPLACE FUNCTION reset_app_popularity()
  RETURNS boolean AS
  $BODY$
DECLARE avg_rating double precision;
DECLARE avg_rating_current double precision;
BEGIN
	delete from app_popularity;

	INSERT INTO app_popularity(app_id, popularity)
	select rating.app_id, rating.rank
	from (
		select a.app_id, score / max_score as rank from
		(
			select a.app_id, score, max(score) over() as max_score
			from (
				select a.app_id, ln(1 + (20 * GREATEST(rating_count * power(rating / 5.0, 2), 1) )/age_days) as score from
				(
					select a.app_id, (r1 * r1_count_root + r2 * r2_count)/(GREATEST(1, r1_count_root + r2_count)) as rating, rating_count, age_days
					from (
						select app_id,
							coalesce(user_rating::double precision, 0) as r1,
							coalesce(power(rating_count::double precision, 0.6), 0) as r1_count_root,
							coalesce(rating_count::double precision, 0) as rating_count,
							coalesce(user_rating_current::double precision, 0) as r2,
							coalesce(rating_count_current::double precision, 0) as r2_count,
							GREATEST(((EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM release_date)) / 86400), 10) as age_days
						from appstore_app
					) a
				) a
			) a
		) a
	) rating
	order by rating.rank desc;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;


