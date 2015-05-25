WITH price AS (
    select *
    from (
           select ph.app_id, ph.price, ph.date_created, row_number() OVER (PARTITION BY ph.app_id ORDER BY ph.id DESC) as pos
           from appstore_price_history ph
             join category_app ca on ph.app_id = ca.app_id
           where ph.country_code = 'USA'
                 and ca.category_id = 765
         ) t
    where t.pos <= 2
)
select p1.app_id, p1.price, p2.price as old_price, p1.date_created, ap.popularity
from (
       select *
       from price
       where pos = 1
             and (date_created + INTERVAL '1 month 3 days') > now() at time zone 'utc'
     ) p1
  join (
         select *
         from price
         where pos = 2
       ) p2 on p1.app_id = p2.app_id and p1.price < p2.price
  join app_popularity ap on p1.app_id = ap.app_id
--order by p1.date_created desc
order by ap.popularity desc


CREATE OR REPLACE FUNCTION update_price_change()
  RETURNS trigger AS
  $BODY$
  BEGIN
    IF NEW.date_deleted is not null THEN
      DELETE FROM appstore_price_change
      WHERE app_id = NEW.app_id
      AND country_code = NEW.country_code;
    ELSIF NEW.price <> OLD.price THEN
      DELETE FROM appstore_price_change
      WHERE app_id = NEW.app_id
      AND country_code = NEW.country_code;

      INSERT INTO appstore_price_change(app_id, price, old_price, country_code, change_date)
      VALUES(NEW.app_id, NEW.price, OLD.price, NEW.country_code, NEW.date_modified);
    END IF;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
  END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;