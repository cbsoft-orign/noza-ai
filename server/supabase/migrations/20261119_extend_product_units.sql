alter table products
  drop constraint if exists products_unit_check;

update products
set unit = 'kg'
where lower(name) ~ '(^|[^[:alnum:]])(ibirayi|potato|potatoes|ibijumba|umuceri|rice|isukari|amasukari|sukari|sugar|ibishyimbo|beans|ibigori|maize|corn|ifu|flour|umunyu|salt|inyanya|tomati|tomato|tomatoes|igitunguru|onion|amapera|guava|avoka|avocado)([^[:alnum:]]|$)';

update products
set unit = 'l'
where lower(name) ~ '(^|[^[:alnum:]])(amavuta|oil|amata|milk)([^[:alnum:]]|$)';

update products
set unit = 'loaf'
where lower(name) ~ '(^|[^[:alnum:]])(umutsima|bread)([^[:alnum:]]|$)';

update products
set unit = 'pack'
where lower(name) ~ '(^|[^[:alnum:]])(icyayi|tea|makaroni|pasta)([^[:alnum:]]|$)';

update products
set unit = 'bottle'
where lower(name) ~ '(^|[^[:alnum:]])(amazi|water|juice|soda|fanta)([^[:alnum:]]|$)';

update products
set unit = 'piece'
where lower(name) ~ '(^|[^[:alnum:]])(igi|egg|eggs|isabune|soap|buji|candle)([^[:alnum:]]|$)';

alter table products
  add constraint products_unit_check
  check (unit in (
    'kg',
    'g',
    'l',
    'ml',
    'piece',
    'pack',
    'bottle',
    'bag',
    'bunch',
    'crate',
    'tray',
    'loaf',
    'slice',
    'cup',
    'dozen',
    'box',
    'pair'
  ));
