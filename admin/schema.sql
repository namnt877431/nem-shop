-- ═══════════════════════════════════════════════════════════════
-- NEM shop — lược đồ cơ sở dữ liệu cho trang quản trị
--
-- Dán toàn bộ file này vào Supabase ▸ SQL Editor ▸ New query ▸ Run.
-- Chạy lại nhiều lần cũng không sao: mọi thứ đều "nếu chưa có thì tạo".
-- ═══════════════════════════════════════════════════════════════

-- ── Kho máy ────────────────────────────────────────────────────
create table if not exists public.cameras (
  id          uuid primary key default gen_random_uuid(),
  code        text not null default '',            -- "1 ▸ aps-c"
  name        text not null,                       -- "Canon EOS R50"
  short       text not null default '',            -- "Canon R50" — tên ngắn cho vòng xoay tính giá
  badge       text not null default '',            -- "APS-C"
  who         text not null default '',            -- đoạn mô tả "hợp với ai"
  specs       jsonb not null default '[]'::jsonb,  -- [{"k":"Cảm biến","v":"24.2MP APS-C"}]
  day_rate    integer not null default 0,          -- đồng / ngày
  featured    boolean not null default false,      -- vòng magenta trên trang
  active      boolean not null default true,       -- còn cho thuê không
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Khách thuê ─────────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text not null default '',
  contact_link    text not null default '',        -- Facebook / Instagram / Zalo
  is_student      boolean not null default false,
  guarantor_name  text not null default '',
  guarantor_phone text not null default '',
  note            text not null default '',
  created_at      timestamptz not null default now()
);

-- ── Đơn thuê ───────────────────────────────────────────────────
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  code             text not null default '',       -- mã đơn hiển thị, vd "2608-01"
  customer_id      uuid references public.customers(id) on delete set null,
  camera_id        uuid references public.cameras(id) on delete set null,
  start_date       date not null,
  end_date         date not null,                  -- ngày trả, tính cả ngày này
  day_rate         integer not null default 0,     -- đơn giá chốt lúc lập đơn
  discount_percent integer not null default 0,
  total            integer not null default 0,
  deposit_kind     text not null default 'tien',   -- tien | tai_san | the_sv | bao_lanh
  deposit_amount   integer not null default 0,
  deposit_note     text not null default '',       -- "laptop Dell", "thẻ SV + số mẹ"
  deposit_returned boolean not null default false,
  status           text not null default 'giu_cho',-- giu_cho | dang_thue | da_tra | huy
  note             text not null default '',
  created_at       timestamptz not null default now(),

  constraint bookings_dates_ok check (end_date >= start_date),
  constraint bookings_status_ok
    check (status in ('giu_cho','dang_thue','da_tra','huy')),
  constraint bookings_deposit_kind_ok
    check (deposit_kind in ('tien','tai_san','the_sv','bao_lanh'))
);

create index if not exists bookings_camera_dates_idx
  on public.bookings (camera_id, start_date, end_date);
create index if not exists bookings_status_idx on public.bookings (status);

-- ── Nội dung trang giới thiệu ──────────────────────────────────
-- Một dòng duy nhất, key = 'site'. Toàn bộ chữ nghĩa của index.html
-- nằm trong cột data để trang quản trị sửa rồi xuất lại file HTML.
create table if not exists public.site_content (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- Khoá cửa: bật RLS trên mọi bảng.
-- Đọc: ai cũng đọc được kho máy và nội dung trang (để sau này trang
--      giới thiệu có thể lấy giá trực tiếp nếu bạn muốn).
-- Ghi: chỉ tài khoản đã đăng nhập.
-- Đơn thuê và khách hàng: chỉ tài khoản đã đăng nhập, cả đọc lẫn ghi.
-- ═══════════════════════════════════════════════════════════════
alter table public.cameras      enable row level security;
alter table public.customers    enable row level security;
alter table public.bookings     enable row level security;
alter table public.site_content enable row level security;

do $$
begin
  -- kho máy: đọc công khai, ghi khi đã đăng nhập
  if not exists (select 1 from pg_policies
                 where tablename = 'cameras' and policyname = 'cameras_read_all') then
    create policy cameras_read_all on public.cameras
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies
                 where tablename = 'cameras' and policyname = 'cameras_write_auth') then
    create policy cameras_write_auth on public.cameras
      for all to authenticated using (true) with check (true);
  end if;

  -- nội dung trang: đọc công khai, ghi khi đã đăng nhập
  if not exists (select 1 from pg_policies
                 where tablename = 'site_content' and policyname = 'content_read_all') then
    create policy content_read_all on public.site_content
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies
                 where tablename = 'site_content' and policyname = 'content_write_auth') then
    create policy content_write_auth on public.site_content
      for all to authenticated using (true) with check (true);
  end if;

  -- khách hàng: kín hoàn toàn
  if not exists (select 1 from pg_policies
                 where tablename = 'customers' and policyname = 'customers_auth_only') then
    create policy customers_auth_only on public.customers
      for all to authenticated using (true) with check (true);
  end if;

  -- đơn thuê: kín hoàn toàn
  if not exists (select 1 from pg_policies
                 where tablename = 'bookings' and policyname = 'bookings_auth_only') then
    create policy bookings_auth_only on public.bookings
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ── Hai chiếc máy đang có, thêm sẵn cho khỏi phải gõ lại ────────
insert into public.cameras (code, name, short, badge, who, specs, day_rate, featured, sort)
select * from (values
  ('1 ▸ aps-c', 'Canon EOS R50', 'Canon R50', 'APS-C',
   'Nhẹ, dễ cầm, bám nét vào mắt rất tốt. Hợp cho chuyến đi chơi, quay vlog, hoặc lần đầu bạn cầm máy rời.',
   '[{"k":"Cảm biến","v":"24.2MP APS-C"},{"k":"Ống kính kèm","v":"RF-S 18–45mm"},{"k":"Quay","v":"4K 30p"},{"k":"Nặng","v":"375g"}]'::jsonb,
   200000, true, 1),
  ('1A ▸ full-frame', 'Canon EOS R8', 'Canon R8', 'Full-frame',
   'Cảm biến full-frame trong thân máy vẫn nhỏ gọn. Chọn máy này khi chụp tối, chụp chân dung xóa phông, hoặc quay 4K 60p.',
   '[{"k":"Cảm biến","v":"24.2MP Full-frame"},{"k":"Ống kính kèm","v":"RF 24–50mm"},{"k":"Quay","v":"4K 60p"},{"k":"Nặng","v":"461g"}]'::jsonb,
   350000, false, 2)
) as seed
where not exists (select 1 from public.cameras);

-- Nếu bạn đã chạy bản schema trước đó, câu này thêm cột "short" còn thiếu.
alter table public.cameras add column if not exists short text not null default '';
update public.cameras set short = name where short = '';
