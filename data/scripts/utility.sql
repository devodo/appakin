-- Populate category_app table from xyo data
-- Precondition: category_app table must be empty
INSERT INTO category_app(category_id, app_id, "position", date_created)
  select c.id, a.id, xca.position, NOW()
  from app a
    join xyo_category_app xca on a.name = xca.name
    join xyo_category_map xcm on xca.xyo_category_id = xcm.xyo_category_id
    join category c on xcm.category_id = c.id
  where xca.batch_id = 2
  order by c.id, xca.position