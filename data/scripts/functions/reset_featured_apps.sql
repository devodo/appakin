-- Function: reset_featured_apps()

-- DROP FUNCTION reset_featured_apps();

CREATE OR REPLACE FUNCTION reset_featured_apps()
  RETURNS boolean AS
$BODY$
BEGIN
  delete from featured_homepage_app
where featured_app_type = 1;

INSERT INTO featured_homepage_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select app_id, category_id, ranking, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, log(ranking) as ranking, num from (
		select category_id, app_id, ranking, row_number() over(partition by category_id order by ranking desc) as num
		from (
			select ca.category_id, ca.app_id, ar.ranking
			from appstore_app a
			join app_ranking ar on a.app_id = ar.app_id and ar.country_code = 'USA'
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2014-08-01'
			and a.date_deleted is null
			order by ar.ranking desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, ranking desc
) t;

delete from featured_category_app
where featured_app_type = 1;

INSERT INTO featured_category_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select t.app_id, t.category_id, t.ranking, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, log(ranking) as ranking, num from (
		select category_id, app_id, ranking, row_number() over(partition by category_id order by ranking desc) as num
		from (
			select ca.category_id, ca.app_id, ar.ranking
			from appstore_app a
			join app_ranking ar on a.app_id = ar.app_id and ar.country_code = 'USA'
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2014-08-01'
			and a.date_deleted is null
			order by ar.ranking desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, ranking desc
) t
left join featured_category_app fa
on t.app_id = fa.app_id and t.category_id = fa.category_id
where fa.id is null;

delete from featured_homepage_category;

INSERT INTO featured_homepage_category(category_id, weight, date_created, date_modified)
select c.id, t.score, NOW() at time zone 'utc', NOW() at time zone 'utc'
from category c
left join xyo_category_map x on c.id = x.category_id
join (
	select category_id, sum(log(ranking)) / 10.0 as score
	from (
		select category_id, ranking, num
		from (
			select category_id, ranking, row_number() over(partition by category_id order by ranking desc) as num
			from (
				select ca.category_id, ar.ranking
				from appstore_app a
				join app_ranking ar on a.app_id = ar.app_id and ar.country_code = 'USA'
				join category_app ca on a.app_id = ca.app_id
				where a.rating_count is not null
				and a.release_date > '2014-01-01'
				and a.date_deleted is null
				order by ar.ranking desc
				limit 5000
			) t
		) t
		where num <= 20
	) t
	group by category_id
	having max(num) >= 7
) t on c.id = t.category_id
where c.date_deleted is null
and (x.id is null or not x.include)
order by t.score desc
limit 50;

  RETURN true;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
