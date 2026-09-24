-- ============================================================
-- OPTIONAL demo seed data.
--
-- Not required for the schema to work. Run this only if you want
-- something to look at immediately after connecting Supabase, instead
-- of starting from an empty database. Real locations should be created
-- by an admin through the admin dashboard (Phase 8).
-- ============================================================

insert into partners (id, business_name, contact_name, phone, email, commission_type, commission_value, active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Silk Road Souvenirs LLC',
  'Aziz Karimov',
  '+998 90 123 45 67',
  'partner@bagdrop.uz',
  'percent',
  15,
  true
)
on conflict (id) do nothing;

insert into locations
  (partner_id, city, name, slug, address, latitude, longitude, description, price_per_bag, capacity, opening_time, closing_time, google_maps_url, yandex_maps_url)
values
  ('00000000-0000-0000-0000-000000000001', 'Samarkand', 'BagDrop — Registan', 'registan',
   '300m from Registan Square, Samarkand', 39.6542, 66.9758,
   'Located inside a verified souvenir shop directly facing Registan Square.',
   30000, 30, '08:00', '22:00',
   'https://maps.google.com/?q=Registan+Samarkand', 'https://yandex.com/maps/?text=Registan+Samarkand'),

  ('00000000-0000-0000-0000-000000000001', 'Samarkand', 'BagDrop — Railway Station', 'railway-station',
   'Next to Samarkand railway station', 39.6975, 66.9558,
   'Ideal for travelers arriving by train. Staffed around the clock.',
   25000, 50, '00:00', '23:59',
   'https://maps.google.com/?q=Samarkand+railway+station', 'https://yandex.com/maps/?text=Samarkand+railway+station'),

  ('00000000-0000-0000-0000-000000000001', 'Samarkand', 'BagDrop — Siyob Bazaar', 'siyob-bazaar',
   'Main entrance of Siyob Bazaar', 39.6608, 66.9793,
   'Drop your bags before browsing the largest bazaar in Samarkand.',
   28000, 20, '07:00', '20:00',
   'https://maps.google.com/?q=Siyob+Bazaar+Samarkand', 'https://yandex.com/maps/?text=Siyob+Bazaar+Samarkand')
on conflict (slug) do nothing;
