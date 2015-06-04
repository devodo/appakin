-- Function: reset_genre_categories()

-- DROP FUNCTION reset_genre_categories();

CREATE OR REPLACE FUNCTION reset_genre_categories()
  RETURNS boolean AS
  $BODY$
BEGIN
  -- delete existing genre category apps
delete from category_app
where category_id in (
  select category_id from genre_category
);

-- populate genere category apps
INSERT INTO category_app(category_id, app_id, "position", date_created)
  select gc.category_id, a.app_id,
    row_number() over(partition by gc.category_id order by p.popularity desc, a.release_date desc),
    now() at time zone 'utc'
  from appstore_app a
    join genre_category gc on true
    left join app_popularity p on a.app_id = p.app_id
    join appstore_price ap on a.app_id = ap.app_id and ap.country_code = 'USA'
  where a.date_deleted is null
        and ap.date_deleted is null
        and (
          (gc.primary_genre is not null AND gc.primary_genre = a.primary_genre) OR
          (gc.primary_genre is null AND gc.genres <@ a.genres)
        );

  RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
