-- Function: reset_app_ranking()

-- DROP FUNCTION reset_app_ranking();

CREATE OR REPLACE FUNCTION reset_app_ranking()
  RETURNS boolean AS
$BODY$
  DECLARE min_age_days integer;
  DECLARE popularity_age_decay double precision;
  DECLARE ranking_age_decay double precision;
  DECLARE rating_rank_weight double precision;
  DECLARE current_rating_weight double precision;
  
  BEGIN
    min_age_days := 5;
    popularity_age_decay := 0.8;
    ranking_age_decay := 0.8;
    rating_rank_weight := 2.0;
    current_rating_weight := 0.6;
    
    delete from app_ranking;

    ALTER SEQUENCE app_ranking_id_seq RESTART WITH 1;

    INSERT INTO app_ranking(app_id, country_code, ranking, popularity)
    select t.app_id, t.country_code, t.ranking, t.popularity
	from (
		select app_id, country_code, sum(t.ranking) as ranking, sum(t.popularity) as popularity
		from (
			select  id, app_id, country_code,
				GREATEST(
				  (
				    coalesce(t.increase, t.rating_count + 1) * power(t.rating / 5.0, rating_rank_weight)
				  ) / pow(t.age_days, ranking_age_decay), 0
				) as ranking,
				GREATEST(
				  (
				    coalesce(t.increase, t.rating_count + 1)
				  ) / pow(t.age_days, popularity_age_decay), 0
				) as popularity
			from
			(
				select id, app_id, country_code,
				GREATEST(
				  (
				    EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM coalesce(date_from, release_date))
				  ) / 86400, min_age_days
				) as age_days,
				GREATEST(
				  (r1 * r1_count_root + r2 * r2_count)/(GREATEST(1, r1_count_root + r2_count)), 1
				) as rating,
				increase,
				rating_count
				from (
					select rh.id, rh.app_id, rh.country_code,
					     rh.rating_count - lag(rh.rating_count) over (partition by rh.app_id, rh.country_code order by rh.id) as increase,
					     lead(rh.date_created) over (partition by rh.app_id, rh.country_code order by rh.id desc) as date_from,
					     a.release_date,
					     coalesce(rh.user_rating::double precision, 0) as r1,
					     coalesce(power(rh.rating_count::double precision, current_rating_weight), 0) as r1_count_root,
					     coalesce(rh.rating_count::double precision, 0) as rating_count,
					     coalesce(rh.user_rating_current::double precision, 0) as r2,
					     coalesce(rh.rating_count_current::double precision, 0) as r2_count
					from appstore_rating_history rh
					join appstore_app a on rh.app_id = a.app_id
					where a.date_deleted is null
					-- Get date of last full rating set
					and rh.date_created <= (
						select back.date_created
						from appstore_refresh_audit tip
						join appstore_refresh_audit back on true
						where tip.id = (select max(id) from appstore_refresh_audit)
						and back.id < tip.id - 100
						and back.last_app_id <= greatest(tip.last_app_id, 2000)
						and back.last_app_id > tip.last_app_id - 10000
						order by back.id desc
						limit 1
					)
				) t
			) t
		) t
		group by t.app_id, t.country_code
	) t
	order by t.ranking desc;

    RETURN true;
  END;
	$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
