-- ============================================================
-- FOTOS OT: reorganizar en 3 etapas (recepcion, proceso, entrega)
-- ============================================================

-- Migrar datos existentes: todo lo anterior pasa a "recepcion" por defecto
update public.fotos_ot set tipo = 'recepcion' where tipo in ('diagnostico', 'salida');

-- Reemplazar el check constraint con las nuevas etapas
alter table public.fotos_ot drop constraint if exists fotos_ot_tipo_check;
alter table public.fotos_ot add constraint fotos_ot_tipo_check
  check (tipo in ('recepcion', 'proceso', 'entrega'));
