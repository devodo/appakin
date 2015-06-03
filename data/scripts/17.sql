CREATE TABLE genre_category
(
  id serial primary key,
  category_id integer not null references category(id),
  primary_genre text,
  genres text[],
  date_created timestamp without time zone NOT NULL
);

-- delete genre categories
update category
set date_deleted = now()
where id in (
  select c.id, c.name
  from appstore_category ac
    join category c on ac.name = c.name
    left join genre_category gc on c.id = gc.category_id
  where parent_id is null
        and c.date_deleted is null
        and gc.id is null
  order by id
);

-- delete genre games categories
update category
set date_deleted = now()
where id in  (
  select c.id
  from category c
    join (
           select ac.name || ' Games' as name
           from appstore_category ac
             join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
         ) t on lower(c.name) = lower(t.name)
  where c.date_deleted is null
);

-- delete genre xyo games categories
update xyo_category_map
set include = false
where xyo_category_id in (
  select xc.id
  from xyo_category xc
    join (
           select ac.name || ' Games' as name
           from appstore_category ac
             join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
         ) t on lower(xc.name) = lower(t.name)
    join xyo_category_map xcm on xc.id = xcm.xyo_category_id
  where xcm.include
);

-- delete genre seed categories
update seed_category
set date_deleted = now()
where id in  (
  select sc.id
  from appstore_category ac
    join seed_category sc on lower(ac.name) = lower(sc.name)
  where sc.date_deleted is null
        and ac.parent_id is null
);

-- delete genre games seed category
update seed_category
set date_deleted = now()
where id in  (
  select sc.id
  from seed_category sc
    join (
           select ac.name || ' Games' as name
           from appstore_category ac
             join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
         ) t on lower(sc.name) = lower(t.name)
  where sc.date_deleted is null
);

-- delete ebooks seed category
update seed_category
set date_deleted = now()
where id in  (
  select sc.id
  from seed_category sc
  where lower(sc.name) = 'ebooks'
        and sc.date_deleted is null
);

-- delete sim games seed category
update seed_category
set date_deleted = now()
where id in  (
  select sc.id
  from seed_category sc
  where lower(sc.name) = 'sim games'
        and sc.date_deleted is null
);


-- delete categories with deleted seed categories
update category
set date_deleted = now()
where id in (
  select c.id
  from category c
    join seed_category_map scm on c.id = scm.category_id
    join seed_category sc on scm.seed_category_id = sc.id
  where c.date_deleted is null
        and sc.date_deleted is not null
);

-- insert genre category categories
INSERT INTO category(ext_id, name, date_created, date_modified)
  select uuid_generate_v4(), ac.name, now() at time zone 'utc', now() at time zone 'utc'
  from appstore_category ac
  left join genre_category gc on ac.name = gc.primary_genre
  where parent_id is null
        and gc.id is null
  order by ac.id;

-- insert genre categories
INSERT INTO genre_category(category_id, primary_genre, genres, date_created)
  select c.id, ac.name, null, now() at time zone 'utc'
  from appstore_category ac
    join category c on ac.name = c.name
    left join genre_category gc on c.id = gc.category_id
  where parent_id is null
        and gc.id is null
        and c.date_deleted is null
  order by ac.id;

-- insert games genre category categories
INSERT INTO category(ext_id, name, date_created, date_modified)
  select uuid_generate_v4(), ac.name, now() at time zone 'utc', now() at time zone 'utc'
  from (
         select ac.name || ' Games' as name
         from appstore_category ac
           join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
       ) ac
    left join (
                select c.name
                from genre_category gc
                  join category c on gc.category_id = c.id
              ) c on lower(ac.name) = lower(c.name)
  where c.name is null;

-- insert games genre categories
INSERT INTO genre_category(category_id, primary_genre, genres, date_created)
select c.id, null, ARRAY['Games', replace(ac.name, 'Books', 'Book')], now() at time zone 'utc'
from appstore_category ac
  join category c on lower(ac.name || ' Games') = lower(c.name)
  join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
  left join genre_category gc on c.id = gc.category_id
where gc.id is null
      and c.date_deleted is null;

update genre_category
set primary_genre = 'Book'
where primary_genre = 'Books';


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

-- scratch pad

INSERT INTO category(ext_id, name, date_created, date_modified)
VALUES (uuid_generate_v4(), 'Games', now() at time zone 'utc', now() at time zone 'utc');

INSERT INTO genre_category(category_id, primary_genre, genres, date_created)
  select
    (select id from category where name = 'Games'),
    'Games',
    null,
    now() at time zone 'utc';

INSERT INTO category(ext_id, name, date_created, date_modified)
VALUES (uuid_generate_v4(), 'Action Games', now() at time zone 'utc', now() at time zone 'utc');

INSERT INTO genre_category(category_id, primary_genre, genres, date_created)
  select
    (select id from category where name = 'Action Games'),
    null,
    ARRAY['Games', 'Action'],
    now() at time zone 'utc';


select *
from category c
  left join genre_category gc on c.id = gc.category_id
  join (
         select ac.name || ' Games' as name
         from appstore_category ac
           join appstore_category ac_p on ac.parent_id = ac_p.id and ac_p.name = 'Games'
       ) t on c.name = t.name
where c.date_deleted is null
      and gc.id is null




INSERT INTO category_app(category_id, app_id, "position", date_created)
  select
    (select id from category where name = 'Games'),
    a.app_id,
    row_number() over(order by p.popularity desc, a.release_date desc),
    now() at time zone 'utc'
  from appstore_app a
    join app_popularity p on a.app_id = p.app_id
    join appstore_price ap on a.app_id = ap.app_id and ap.country_code = 'USA'
  where 'Games' = a.primary_genre
        and a.date_deleted is null
        and ap.date_deleted is null
  order by p.popularity desc, a.release_date desc
