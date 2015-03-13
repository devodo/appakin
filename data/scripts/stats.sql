-- Category click count
select c.*, t.total
from category c
  join (
         select category_id, count(1) as total
         from referral_audit
         group by category_id
       ) t on c.id = t.category_id
order by t.total desc;

-- App click count
select a.name, t.total
from appstore_app a
  join (
         select app_id, count(1) as total
         from referral_audit
         group by app_id
       ) t on a.app_id = t.app_id
order by t.total desc;