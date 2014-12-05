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

	r1_scaled = power(r1_count, 0.6);
	r2_scaled = power(r2_count, 1);
	merge_ratio = r1_scaled / (r1_scaled + r2_scaled);

	RETURN  rating_confidence(r1, r1_count, r1_mean, r1_const) * merge_ratio +
		rating_confidence(r2, r2_count, r2_mean, r2_const) * (1 - merge_ratio);
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;


-- Function: reset_app_popularity()

--x^((5/5)* 0.2 * e^(-0.001x) + 0.2 * (1 - e^(-0.001x)))
--http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiJ4XigoNS81KSowLjE1KmVeKC0wLjAwMXgpKzAuMTUqKDEtZV4oLTAuMDAxeCkpKSIsImNvbG9yIjoiI0VCMEUwRSJ9LHsidHlwZSI6MCwiZXEiOiJ4XigoNC81KSowLjE1KmVeKC0wLjAxeCkrMC4xNSooMS1lXigtMC4wMXgpKSkiLCJjb2xvciI6IiM0NUEzMjkifSx7InR5cGUiOjAsImVxIjoieF4oKDMvNSkqMC4xNSplXigtMC4wMXgpKzAuMTUqKDEtZV4oLTAuMDF4KSkpIiwiY29sb3IiOiIjQTkxMEU2In0seyJ0eXBlIjowLCJlcSI6InheKCgyLzUpKjAuMTUqZV4oLTAuMDF4KSswLjE1KigxLWVeKC0wLjAxeCkpKSIsImNvbG9yIjoiIzFFMjRENCJ9LHsidHlwZSI6MCwiZXEiOiJ4XigoMS81KSowLjE1KmV4cCgtMC4wMXgpKzAuMTUqKDEtZXhwKC0wLjAxeCkpKSIsImNvbG9yIjoiI0U4OTQzQSJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIi0yIiwiMTAiLCItMiIsIjQiXX1d

-- DROP FUNCTION reset_app_popularity();

-- Function: reset_app_popularity()

-- DROP FUNCTION reset_app_popularity();

CREATE OR REPLACE FUNCTION reset_app_popularity()
  RETURNS boolean AS
  $BODY$
BEGIN
	delete from app_popularity;

	INSERT INTO app_popularity(app_id, popularity)
	select rating.app_id, GREATEST(rating_rank, chart_rank) as rank
	from (
		select a.app_id, power(rating_rate, ((0.5 * rating/5.0) * exp(-0.01 * rating_rate)) + (0.5 * (1 - exp(-0.01 * rating_rate)))) - 1 as rating_rank
		from (
			select a.app_id, (r1 * r1_count_root + r2 * r2_count)/(r1_count_root + r2_count) as rating, rating_rate
			from (
				select a.app_id,
					coalesce(a.user_rating::double precision, 0) as r1,
					coalesce(power(a.rating_count::double precision, 0.6), 0) as r1_count_root,
					coalesce(a.user_rating_current::double precision, 0) as r2,
					coalesce(a.rating_count_current::double precision, 0) as r2_count,
					1 + (a.rating_count / power(GREATEST(((EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM release_date)) / 86400), 10), 0.5)) as rating_rate
				from appstore_app a
				where a.rating_count is not null
			) a
		) a
		where a.rating > 0
	) rating
	left join (
		select a.app_id, 1 - (power(log(min(chart.position))/log(10000),2)) as chart_rank
		from appstore_app a
		join appstore_chart chart on a.store_app_id = chart.store_app_id
		where chart.batch_id = (select max(batch_id) from appstore_chart)
		group by a.app_id
	) chart on rating.app_id = chart.app_id
	order by rank desc;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;




