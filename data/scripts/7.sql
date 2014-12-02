-- add include column to xyo category mapping table
alter table xyo_category_map add column include boolean;
update xyo_category_map set include = true;
alter table xyo_category_map alter column include set not null;

CREATE TABLE seed_category_map
(
  id serial primary key,
  category_id integer NOT NULL REFERENCES category (id),
  seed_category_id integer NOT NULL REFERENCES seed_category (id),
  build_version integer NOT NULL
);

alter table seed_category_map add CONSTRAINT seed_category_map_category_unique UNIQUE (category_id);
alter table seed_category_map add CONSTRAINT seed_category_map_seed_category_unique UNIQUE (seed_category_id);

alter table seed_category add column is_active boolean not null default(false);
alter table seed_category add column build_version integer;
alter table seed_category add column build_message text;

-- Delete disabled xyo categories
update category
set date_deleted = NOW() at time zone 'utc'
where id in (
  select category_id
  from xyo_category_map
  where not include)
      and date_deleted is null;

delete from
  category_app
where id in (
  select ca.id
  from category_app ca
    join category_app_exclude ca_e on ca.category_id = ca_e.category_id AND ca.app_id = ca_e.app_id
);

CREATE unique INDEX category_app_position_unique ON category_app (category_id, position);