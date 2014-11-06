-- Function: rating_confidence(double precision, double precision, double precision, double precision)

-- DROP FUNCTION rating_confidence(double precision, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION rating_confidence(rating double precision, rating_count double precision, mean double precision, min_count double precision)
  RETURNS double precision AS
  $BODY$
BEGIN
	RETURN rating * rating_count/(rating_count + min_count) + mean * min_count/(rating_count + min_count);
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
ALTER FUNCTION rating_confidence(double precision, double precision, double precision, double precision)
OWNER TO appakin;





-- Function: rating_merge(double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision)

-- DROP FUNCTION rating_merge(double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION rating_merge(r1 double precision, r1_count double precision, r1_mean double precision, r1_const double precision, r2 double precision, r2_count double precision, r2_mean double precision, r2_const double precision)
  RETURNS double precision AS
  $BODY$
DECLARE merge_ratio double precision;
DECLARE r1_scaled double precision;
DECLARE r2_scaled double precision;
BEGIN
	IF ((r1_count is null OR r1 is null OR r1_count = 0 OR r1 = 0) AND
	   (r2_count is null OR r2 is null OR r2_count = 0 OR r2 = 0)) THEN
		RETURN 0;
	END IF;

	IF (r1_count is null OR r1 is null OR r1_count = 0 OR r1 = 0) THEN
		RETURN rating_confidence(r2, r2_count, r2_mean, r2_const);
	END IF;

	IF (r2_count is null OR r2 is null OR r2_count = 0 OR r2 = 0) THEN
		RETURN rating_confidence(r1, r1_count, r1_mean, r1_const);
	END IF;

	IF (r2_count >= r1_count) THEN
		RETURN rating_confidence(r2, r2_count, r2_mean, r2_const);
	END IF;

	r1_scaled = power(r1_count * 5, 0.5);
	r2_scaled = power(r2_count * 0.5, 2);
	merge_ratio = r1_scaled / (r1_scaled + r2_scaled);

	RETURN  rating_confidence(r1, r1_count, r1_mean, r1_const) * merge_ratio +
		rating_confidence(r2, r2_count, r2_mean, r2_const) * (1 - merge_ratio);
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
ALTER FUNCTION rating_merge(double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision)
OWNER TO appakin;



-- Function: reset_app_popularity()

-- DROP FUNCTION reset_app_popularity();

CREATE OR REPLACE FUNCTION reset_app_popularity()
  RETURNS boolean AS
  $BODY$
DECLARE avg_rating double precision;
DECLARE avg_rating_current double precision;
BEGIN
	SELECT ar, arc INTO avg_rating, avg_rating_current
	from (
		SELECT  avg(user_rating::double precision) as ar,
			avg(user_rating_current::double precision) as arc
		FROM    appstore_app
	) t;

	delete from app_popularity;

	INSERT INTO app_popularity(app_id, popularity)
	select app_id, percent_rank() over (order by rank desc) as percent_rank
	from (
		select rating.app_id, LEAST(rating_rank, chart_rank) as rank
		from (
			select app_id, rank() over (order by rm desc) as rating_rank
			from (
				select app_id, rating_merge(r1, r1_count, avg_rating, 10, r2, r2_count, avg_rating_current, 10) as rm
				from (
					select a.app_id,
						a.user_rating::double precision as r1, a.rating_count::double precision as r1_count,
						a.user_rating_current::double precision as r2, a.rating_count_current::double precision as r2_count
					from appstore_app a
				) t
			) t
			where t.rm > 0
		) rating
		left join (
			select a.app_id, min(chart.position) as chart_rank
			from appstore_app a
			join appstore_chart chart on a.store_app_id = chart.store_app_id
			where chart.batch_id = (select max(batch_id) from appstore_chart)
			group by a.app_id
		) chart on rating.app_id = chart.app_id
	) t
	order by percent_rank desc;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
ALTER FUNCTION reset_app_popularity()
OWNER TO appakin;
