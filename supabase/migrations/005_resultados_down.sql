-- Reversión de 005. Borra el registro de lo que pasó con cada tarea y el resultado guardado:
-- ejecútalo solo si de verdad quieres perder esa información. Las tareas y sus fechas no se tocan.
drop table if exists public.task_log;

alter table public.tasks drop constraint if exists tasks_result_valid;
alter table public.tasks drop constraint if exists tasks_result_note_len;
alter table public.tasks drop column if exists result;
alter table public.tasks drop column if exists result_note;
alter table public.tasks drop column if exists result_at;
