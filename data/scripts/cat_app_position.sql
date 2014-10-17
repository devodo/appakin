alter table category_app add column old_position integer;

update category_app
set old_position = position;


update category_app v
set position = t.new_pos
from (
       select category_id, app_id, name, old_pos, score, row_number() OVER (PARTITION BY category_id order by score desc) as new_pos
       from (
              select category_id, app_id, name, old_pos, position + chart + rating as score
              from (
                     select category_id, app_id, name, old_pos, position, chart, exp(rating - avg_rating) as rating
                     from (
                            select category_id, app_id, name, position as old_pos, coalesce(1.0 + 1.0/pow(position*0.5,0.6), 1.0) as position, coalesce(1.0 + 1.0/pow(chart*0.5,0.6), 1.0) as chart, coalesce(rating, avg_rating) as rating, avg_rating
                            from (
                                   select category_id, app_id, name, position, chart, ci_rating, rating_count, ci_rating_current, rating_count_current, (C1 + C2) / 2 as avg_rating, ((ci_rating * ratio) + ci_rating_current)/(ratio + 1) as rating
                                   from (
                                          select category_id, app_id, name, position, chart, w1 * R1 + (1 - w1) * C1 as ci_rating, R1, C1, A1, rating_count, w2 * R2 + (1 - w2) * C2 as ci_rating_current, R2, C2, A2, rating_count_current, ratio
                                          from (
                                                 select category_id, app_id, name, position, chart, rating_count/(rating_count + A1*0.5) as w1, R1, C1, A1, rating_count, rating_count_current/(rating_count_current + A2*0.1) as w2, R2, C2, A2, rating_count_current, (0.2 * rating_count / A1) / (rating_count_current / A2) as ratio
                                                 from (
                                                        select ca.category_id, app.app_id, app.name, ca.position::double precision,
                                                          app.rating_count::double precision as rating_count, app.user_rating::double precision as R1,
                                                          app.rating_count_current::double precision as rating_count_current, app.user_rating_current::double precision as R2,
                                                          avg(app.user_rating::double precision) OVER (PARTITION BY ca.category_id) as C1,
                                                          avg(app.user_rating_current::double precision) OVER (PARTITION BY ca.category_id) as C2,
                                                          avg(app.rating_count::double precision) OVER (PARTITION BY ca.category_id) as A1,
                                                          avg(app.rating_count_current::double precision) OVER (PARTITION BY ca.category_id) as A2,
                                                          (select min(position::double precision) from appstore_chart where store_app_id = app.store_app_id) as chart
                                                        from category_app ca
                                                          join appstore_app app on ca.app_id = app.app_id
                                                          left join category_app_exclude ca_e on ca.category_id = ca_e.category_id and ca.app_id = ca_e.app_id
                                                        where ca_e.id is null
                                                      ) as t
                                               ) as t
                                        ) as t
                                 ) as t
                          ) as t
                   ) as t
            ) as t
     ) as t
where v.category_id = t.category_id and v.app_id = t.app_id;



