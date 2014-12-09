INSERT INTO featured_category(category_id, weight, date_created, date_modified)
select c.id, t.score, NOW() at time zone 'utc', NOW() at time zone 'utc'
from category c
join (
 select category_id, ln(1 + sum(rating_rate)) / 10.0 as score from (
   select category_id, rating_rate, num from (
     select category_id, rating_rate, row_number() over(partition by category_id order by rating_rate desc) as num
     from (
      select ca.category_id,
        ((EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM a.release_date)) / 86400) / a.rating_count as rating_rate
      from appstore_app a
      join category_app ca on a.app_id = ca.app_id
      where a.rating_count is not null
      and a.release_date > '2014-01-01'
      and a.date_deleted is null
    ) t
   ) t
   where num < 200
 ) t
 group by category_id
) t on c.id = t.category_id
where c.date_deleted is null
order by t.score desc;

INSERT INTO featured_app(app_id, category_id, weight, date_created, date_modified)
select app_id, category_id, score, NOW() at time zone 'utc', NOW() at time zone 'utc' from (
  select category_id, app_id, score, num from (
    select category_id, app_id, ln(1 + rating_rate) / 10.0 as score, row_number() over(partition by category_id order by rating_rate desc) as num
    from (
          select ca.category_id, a.app_id,
          ((EXTRACT(EPOCH FROM NOW() at time zone 'utc') - EXTRACT(EPOCH FROM a.release_date)) / 86400) / a.rating_count as rating_rate
          from appstore_app a
          join category_app ca on a.app_id = ca.app_id
          where a.rating_count is not null
          and a.release_date > '2014-01-01'
          and a.date_deleted is null
        ) t
  ) t
  where num < 200
  order by category_id, score desc
) t;