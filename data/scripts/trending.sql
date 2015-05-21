select ar.app_id, ar.rating_count, arh.min_rating_count, ar.rating_count - arh.min_rating_count as rating_count_diff
from appstore_rating ar
  join (
         select app_id, min(rating_count) as min_rating_count
         from appstore_rating_history
         where rating_count is not null
               and (date_created + INTERVAL '1 month') >= now() at time zone 'utc'
         group by app_id
       ) arh on ar.app_id = arh.app_id
where ar.rating_count is not null
order by rating_count_diff desc
limit 10;



INSERT INTO category(ext_id, name, date_created, date_modified)
VALUES (uuid_generate_v4(), 'Trending Games', now() at time zone 'utc', now() at time zone 'utc');

INSERT INTO category(ext_id, name, date_created, date_modified)
VALUES (uuid_generate_v4(), 'Trending Apps', now() at time zone 'utc', now() at time zone 'utc');

begin transaction;
rollback;

delete from category_app
where category_id = (select id from category where name = 'Trending Games')

INSERT INTO category_app(category_id, app_id, position, date_created)
select (select id from category where name = 'Trending Apps'),
       t.app_id,
       row_number() OVER(order by t.rating_count_diff desc) as position,
       now() at time zone 'utc'
from appstore_app a
join (
	select ar.app_id, ar.rating_count, arh.min_rating_count, ar.rating_count - arh.min_rating_count as rating_count_diff
	from appstore_rating ar
	join (
	   select app_id, min(rating_count) as min_rating_count
	   from appstore_rating_history
	   where rating_count is not null
	   and (date_created + INTERVAL '30 days') >= now() at time zone 'utc'
	   group by app_id
	) arh on ar.app_id = arh.app_id
	where ar.rating_count is not null
) t on a.app_id = t.app_id
where t.rating_count_diff >= 500
and 'Games' != ALL(a.genres)
order by t.rating_count_diff desc;