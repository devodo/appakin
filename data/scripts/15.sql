CREATE TABLE appstore_price_change
(
  id serial primary key,
  app_id integer NOT NULL references appstore_app(app_id),
  country_code character(3) NOT NULL,
  price numeric(8,3) NOT NULL,
  old_price numeric(8,3) NOT NULL,
  change_date timestamp without time zone NOT NULL,
  CONSTRAINT appstore_price_change_country_code_app_id_unique UNIQUE (country_code, app_id)
);

CREATE OR REPLACE FUNCTION update_price_change() RETURNS TRIGGER AS
  $BODY$
  BEGIN
    IF NEW.price <> OLD.price THEN
      DELETE FROM appstore_price_change
      WHERE app_id = NEW.app_id
      AND country_code = NEW.country_code;

      INSERT INTO appstore_price_change(app_id, price, old_price, country_code, change_date)
      VALUES(NEW.app_id, NEW.price, OLD.price, NEW.country_code, NEW.date_modified);
    END IF;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
  END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER price_changes
AFTER UPDATE
ON appstore_price
FOR EACH ROW
EXECUTE PROCEDURE update_price_change();


INSERT INTO appstore_price_change(app_id, price, old_price, country_code, change_date)
  WITH price AS (
      select *
      from (
             select ph.app_id, ph.price, ph.country_code, ph.date_created, row_number() OVER (PARTITION BY ph.app_id, ph.country_code ORDER BY ph.id DESC) as pos
             from appstore_price_history ph
           ) t
      where t.pos <= 2
  )
  select p1.app_id, p1.price, p2.price as old_price, p1.country_code, p1.date_created
  from (
         select *
         from price
         where pos = 1
       ) p1
    join (
           select *
           from price
           where pos = 2
         ) p2 on p1.app_id = p2.app_id and p1.country_code = p2.country_code and p1.price != p2.price
  order by p1.date_created