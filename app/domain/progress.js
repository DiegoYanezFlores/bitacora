// Progreso de un proyecto (fórmula v2): métrica si la hay; si no, hitos (peso doble) y tareas; si no, % manual.
// Función pura. La nueva iteración la sustituye por avance por hitos y criterios (docs, plan técnico §8).
import { clamp } from '../lib.js';

export const fmtNum = n => Number(n).toLocaleString('es', { maximumFractionDigits: 2 });

// milestones y tasks: solo los del proyecto y sin borrados.
export function projectProgress(p, milestones, tasks) {
  if (!p) return { pct: 0, mode: 'none', label: '' };
  const num = v => (v === null || v === undefined || v === '' ? null : Number(v));
  const [s, c, t] = [num(p.metric_start), num(p.metric_current), num(p.metric_target)];
  if (s !== null && c !== null && t !== null && t !== s) {
    const pct = Math.round(clamp(((c - s) / (t - s)) * 100, 0, 100));
    const unit = p.metric_unit ? ' ' + p.metric_unit : '';
    return { pct, mode: 'metric', label: `${fmtNum(c)} → ${fmtNum(t)}${unit}` };
  }
  if (milestones.length || tasks.length) {
    const doneMs = milestones.filter(m => m.done_at).length;
    const doneTs = tasks.filter(x => x.status === 'done').length;
    const pct = p.status === 'done' ? 100 : Math.round(((doneMs * 2 + doneTs) / (milestones.length * 2 + tasks.length)) * 100);
    const parts = [];
    if (tasks.length) parts.push(`${doneTs}/${tasks.length} tareas`);
    if (milestones.length) parts.push(`${doneMs}/${milestones.length} hitos`);
    return { pct, mode: 'auto', label: parts.join(' · ') };
  }
  if (p.progress_manual !== null && p.progress_manual !== undefined) return { pct: p.progress_manual, mode: 'manual', label: 'Manual' };
  return { pct: p.status === 'done' ? 100 : 0, mode: 'none', label: 'Sin tareas ni hitos' };
}
