-- =====================================================
-- JStudio: tabla de reseñas en Supabase
-- Pegar completo en Supabase > SQL Editor > Run
-- =====================================================

create table if not exists public.resenas (
    id        bigint generated always as identity primary key,
    nombre    text        not null check (char_length(nombre) between 1 and 40),
    puntaje   smallint    not null check (puntaje between 1 and 5),
    texto     text        not null check (char_length(texto) between 5 and 280),
    fecha     timestamptz not null default now(),
    aprobada  boolean     not null default true   -- cambiar a false para moderar (ver abajo)
);

alter table public.resenas enable row level security;

-- Cualquiera puede LEER solo las reseñas aprobadas
drop policy if exists "ver aprobadas" on public.resenas;
create policy "ver aprobadas" on public.resenas
    for select to anon using (aprobada);

-- Cualquiera puede ENVIAR una reseña nueva
drop policy if exists "enviar reseña" on public.resenas;
create policy "enviar reseña" on public.resenas
    for insert to anon with check (true);

-- Permisos por columna: el visitante NO puede decidir "aprobada" ni tocar el id
revoke all on public.resenas from anon;
grant select (nombre, puntaje, texto, fecha, aprobada) on public.resenas to anon;
grant insert (nombre, puntaje, texto) on public.resenas to anon;


