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

--x^((5/5)* 0.2 * e^(-0.001x) + 0.2 * (1 - e^(-0.001x)))
--http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiJ4XigoNS81KSowLjE1KmVeKC0wLjAwMXgpKzAuMTUqKDEtZV4oLTAuMDAxeCkpKSIsImNvbG9yIjoiI0VCMEUwRSJ9LHsidHlwZSI6MCwiZXEiOiJ4XigoNC81KSowLjE1KmVeKC0wLjAxeCkrMC4xNSooMS1lXigtMC4wMXgpKSkiLCJjb2xvciI6IiM0NUEzMjkifSx7InR5cGUiOjAsImVxIjoieF4oKDMvNSkqMC4xNSplXigtMC4wMXgpKzAuMTUqKDEtZV4oLTAuMDF4KSkpIiwiY29sb3IiOiIjQTkxMEU2In0seyJ0eXBlIjowLCJlcSI6InheKCgyLzUpKjAuMTUqZV4oLTAuMDF4KSswLjE1KigxLWVeKC0wLjAxeCkpKSIsImNvbG9yIjoiIzFFMjRENCJ9LHsidHlwZSI6MCwiZXEiOiJ4XigoMS81KSowLjE1KmV4cCgtMC4wMXgpKzAuMTUqKDEtZXhwKC0wLjAxeCkpKSIsImNvbG9yIjoiI0U4OTQzQSJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIi0yIiwiMTAiLCItMiIsIjQiXX1d


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
                                   select a.app_id,
                                     coalesce(r.user_rating::double precision, 0) as r1,
                                     coalesce(power(r.rating_count::double precision, 0.6), 0) as r1_count_root,
                                     coalesce(r.rating_count::double precision, 0) as rating_count,
                                     coalesce(r.user_rating_current::double precision, 0) as r2,
                                     coalesce(r.rating_count_current::double precision, 0) as r2_count,
                                     GREATEST(((EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM a.release_date)) / 86400), 10) as age_days
                                   from appstore_app a
                                     join appstore_price p on a.app_id = p.app_id and p.country_code = 'USA'
                                     left join appstore_rating r on a.app_id = r.app_id and r.country_code = 'USA'
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

CREATE OR REPLACE FUNCTION reset_category_popularity()
  RETURNS boolean AS
  $BODY$
BEGIN
	delete from category_popularity;

	INSERT INTO category_popularity(category_id, popularity)
	select category_id, score/max_score
	from (
		select category_id, score, max(score) over() as max_score
		from (
			select t.category_id, ln(1 + t.popularity / power(t.length, 0.3)) * (CASE WHEN xm.id is null THEN 1.0 ELSE 0.1 END) as score
			from (
				select c.category_id, c.popularity, ca.length
				from (
					select ca.category_id, sum(ap.popularity) as popularity
					from category_app ca
					join app_popularity ap on ca.app_id = ap.app_id
					join category c on ca.category_id = c.id
					where c.date_deleted is null
					and ap.popularity > 0
					and ca.position <= 200
					group by ca.category_id
				) c
				join (
					select category_id, count(1) as length
					from category_app
					group by category_id
				) ca on c.category_id = ca.category_id
			) t
			left join xyo_category_map xm on t.category_id = xm.category_id
		) t
	) t
	order by category_id;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;





