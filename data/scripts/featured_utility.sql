INSERT INTO featured_homepage_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select app_id, category_id, popularity, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, popularity, num from (
		select category_id, app_id, popularity, row_number() over(partition by category_id order by popularity desc) as num
		from (
			select ca.category_id, ca.app_id, ap.popularity
			from appstore_app a
			join app_popularity ap on a.app_id = ap.app_id
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2013-01-01'
			and a.date_deleted is null
			order by ap.popularity desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, popularity desc
) t;

INSERT INTO featured_category_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select app_id, category_id, popularity, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, popularity, num from (
		select category_id, app_id, popularity, row_number() over(partition by category_id order by popularity desc) as num
		from (
			select ca.category_id, ca.app_id, ap.popularity
			from appstore_app a
			join app_popularity ap on a.app_id = ap.app_id
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2013-01-01'
			and a.date_deleted is null
			order by ap.popularity desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, popularity desc
) t;


INSERT INTO featured_homepage_category(category_id, weight, date_created, date_modified)
select c.id, t.score, NOW() at time zone 'utc', NOW() at time zone 'utc'
from category c
left join xyo_category_map x on c.id = x.category_id
join (
	select category_id, sum(popularity) / 10.0 as score
	from (
		select category_id, popularity, num
		from (
			select category_id, popularity, row_number() over(partition by category_id order by popularity desc) as num
			from (
				select ca.category_id, ap.popularity
				from appstore_app a
				join app_popularity ap on a.app_id = ap.app_id
				join category_app ca on a.app_id = ca.app_id
				where a.rating_count is not null
				and a.release_date > '2013-01-01'
				and a.date_deleted is null
				order by ap.popularity desc
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
