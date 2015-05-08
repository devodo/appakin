begin transaction;

delete from featured_homepage_app
where featured_app_type = 1;

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
			and a.release_date > '2014-01-01'
			and a.date_deleted is null
			order by ap.popularity desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, popularity desc
) t;

delete from featured_category_app
where featured_app_type = 1;

INSERT INTO featured_category_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select t.app_id, t.category_id, t.popularity, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, popularity, num from (
		select category_id, app_id, popularity, row_number() over(partition by category_id order by popularity desc) as num
		from (
			select ca.category_id, ca.app_id, ap.popularity
			from appstore_app a
			join app_popularity ap on a.app_id = ap.app_id
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2014-01-01'
			and a.date_deleted is null
			order by ap.popularity desc
			limit 5000
		) t
	) t
	where num <= 20
	order by category_id, popularity desc
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
				and a.release_date > '2014-01-01'
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

commit;

-- Insert single category
INSERT INTO featured_category_app(app_id, category_id, weight, featured_app_type, date_created, date_modified)
select t.app_id, t.category_id, t.popularity, 1, NOW() at time zone 'utc', NOW() at time zone 'utc'
from (
	select category_id, app_id, popularity, num from (
		select category_id, app_id, popularity, row_number() over(partition by category_id order by popularity desc) as num
		from (
			select ca.category_id, ca.app_id, ap.popularity
			from appstore_app a
			join app_popularity ap on a.app_id = ap.app_id
			join category_app ca on a.app_id = ca.app_id
			where a.rating_count is not null
			and a.release_date > '2014-01-01'
			and a.date_deleted is null
			order by ap.popularity desc
			limit 5000
		) t
	) t
	where num <= 20
	and category_id = 866
	order by category_id, popularity desc
) t
left join featured_category_app fa
		on t.app_id = fa.app_id and t.category_id = fa.category_id
where fa.id is null;


INSERT INTO featured_category_app(app_id, category_id, weight, fixed_order, featured_app_type,
																	date_created, date_modified, date_deleted, start_date, end_date)
VALUES (1133860, 865, 0, 1, 3, now(), now(), null, now(), null);
