-- Populate category_app table from xyo data
-- Precondition: category_app table must be empty
INSERT INTO category_app(category_id, app_id, "position", old_position, date_created)
  select c.id, a.id, xca.position, NOW()
  from app a
    join xyo_category_app xca on a.name = xca.name
    join xyo_category_map xcm on xca.xyo_category_id = xcm.xyo_category_id
    join category c on xcm.category_id = c.id
  where xca.batch_id = 2
  order by c.id, xca.position;



-- Insert classification training apps
INSERT INTO seed_training(seed_category_id, app_ext_id, include, date_created)
  select 3, a.ext_id, true, now()
  from appstore_app a
    left join (
                select *
                from seed_training
                where seed_category_id = 3
              ) st on a.ext_id = st.app_ext_id
  where st.id is null
        and a.ext_id in
            (
              'd746c7f5f32b4464ab91a5c5f18032b6',
              'b711c1bb6a4a438a9f44552f696cdeb4',
              '79625e583cb64ac59bdd656194670317',
              '5cc2ade298bb49929a0cc7a6e9005e19',
              'a5a1fb41da2d4797ae0d7c1cf9a7803d',
              '52465c6d0d614283a40a184f5f5896ae',
              '182a598820e3449a93f64083da092172',
              '3034d6dd083f46ae815e0dc3e9056ce5',
              '2bfc56d41d3142d4825bcc0efebcc918',
              '52d917f4c5e84d299fd034e0bb48b19a',
              '570628c472c14e6ab9f5460ff5b49d9b'
            );