alter table public.categories
  add column if not exists icon text not null default 'Tag',
  add column if not exists color text not null default 'oklch(0.68 0.018 250)';

update public.categories
set
  icon = case
    when name ilike '%venda%' then 'ShoppingCart'
    when name ilike '%servi%' then 'Briefcase'
    when name ilike '%rendimento%' then 'TrendingUp'
    when name ilike '%folha%' then 'Users'
    when name ilike '%aluguel%' then 'Home'
    when name ilike '%fornecedor%' then 'Package'
    when name ilike '%marketing%' then 'Globe'
    when name ilike '%utilidade%' then 'Zap'
    else icon
  end,
  color = case
    when type = 'INCOME' then 'oklch(0.72 0.13 158)'
    when type = 'EXPENSE' then 'oklch(0.66 0.19 24)'
    else color
  end
where icon = 'Tag'
  and color = 'oklch(0.68 0.018 250)';
