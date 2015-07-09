SELECT id, last_app_id, is_success, error_message, date_created
  FROM appstore_refresh_audit
  order by 1 desc
  limit 10


select *
from appstore_refresh_audit
where last_app_id <= 487356
and last_app_id > 486135
order by id desc
limit 1

select *
from appstore_app
where ext_id = '4ad99f1448f648acbb71c37032025198'

-- Get last complete rating refresh date
select back.date_created
from appstore_refresh_audit tip
join appstore_refresh_audit back on true
where tip.id = (select max(id) from appstore_refresh_audit)
and back.id < tip.id - 100
and back.last_app_id <= greatest(tip.last_app_id, 2000)
and back.last_app_id > tip.last_app_id - 10000
order by back.id desc
limit 1;

select a.name, t.app_id, t.country_code, t.ranking, t.popularity
from (
	select app_id, country_code, sum(t.ranking) as ranking, sum(t.popularity) as popularity
	from (
		select  id, app_id, country_code,
			GREATEST(
			  (coalesce(t.increase, t.rating_count) * power(t.rating / 5.0, 2)) / (t.age_days - 4.0), 0
			) as ranking,
			GREATEST(
			  (coalesce(t.increase, t.rating_count)) / (t.age_days - 4.0), 0
			) as popularity
		from
		(
			select id, app_id, country_code,
			GREATEST(
			  (
			    EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM coalesce(date_from, release_date))
			  ) / 86400, 5
			) as age_days,
			(r1 * r1_count_root + r2 * r2_count)/(GREATEST(1, r1_count_root + r2_count)) as rating,
			increase,
			rating_count
			from (
				select rh.id, rh.app_id, rh.country_code,
				     rh.rating_count - lag(rh.rating_count) over (partition by rh.app_id, rh.country_code order by rh.id) as increase,
				     lead(rh.date_created) over (partition by rh.app_id, rh.country_code order by rh.id desc) as date_from,
				     a.release_date,
				     coalesce(rh.user_rating::double precision, 0) as r1,
				     coalesce(power(rh.rating_count::double precision, 0.6), 0) as r1_count_root,
				     coalesce(rh.rating_count::double precision, 0) as rating_count,
				     coalesce(rh.user_rating_current::double precision, 0) as r2,
				     coalesce(rh.rating_count_current::double precision, 0) as r2_count
				from appstore_rating_history rh
				join appstore_app a on rh.app_id = a.app_id
				where a.date_deleted is null
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
				--and rh.app_id in (310819, 1166584, 1209596)
			) t
		) t
	) t
	group by t.app_id, t.country_code
) t
join appstore_app a on t.app_id = a.app_id
order by t.ranking desc
limit 10000;

CREATE TABLE app_ranking
(
  id bigserial primary key,
  app_id integer NOT NULL references appstore_app(app_id),
  country_code character(3) NOT NULL,
  ranking double precision NOT NULL,
  popularity double precision NOT NULL,
  CONSTRAINT app_ranking_country_code_app_id_unique UNIQUE (country_code, app_id)
);