alter table appstore_app add column is_iphone boolean;
alter table appstore_app add column is_ipad boolean;
alter table appstore_app add column is_free boolean;

update appstore_app
set is_free = (price = 0),
  is_ipad = (array_to_string(supported_devices,',') ~* 'ipad'),
  is_iphone = (array_to_string(supported_devices,',') ~* 'iphone');

alter table appstore_app alter column is_iphone set not null;
alter table appstore_app alter column is_ipad set not null;
alter table appstore_app alter column is_free set not null;