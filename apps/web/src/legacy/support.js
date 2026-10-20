// Hilfen für die Referenz-Oberfläche im Browser.
import { FOODS, materialize, syncHabits, syncPlanRoutines } from '@healthos/domain';

/** Leerer Startzustand für echte Konten: Plan aus den Einstellungen, keine Mess- oder Demo-Daten. */
export function emptyState(today, cfg) {
  const routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
  return materialize({
    routines, items: [], workouts: [], weights: [], steps: [], foods: FOODS.map(f => ({ ...f, fav: false, custom: false })), favMeals: [], meals: [],
    labs: [], appointments: [], habits: syncHabits([], cfg), habitLog: {}, dismissed: [], pauses: [], recState: {}, reviews: {},
  }, today);
}

/** Ersatz für die Download-Funktion der Claude-Laufzeit. */
export const browserDownloads = {
  async save({ filename, data }) {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
