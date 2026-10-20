/**
 * Kataloge und Stammdaten. Werte automatisiert und unverändert aus der Referenz v5 übernommen
 * (siehe tools/extract-catalog.py) und per Paritätstest gegen die Referenz geprüft.
 */
import type { Config, Coverage, Food, GoalKey, ItemStatus } from './types.js';

export const SCHEMA = 2;
export const TYPES: Record<string, { label: string; icon: string }> = {
  training: { label: 'Training', icon: 'dumbbell' },
  bewegung: { label: 'Bewegung', icon: 'activity' },
  ernaehrung: { label: 'Ernährung', icon: 'utensils' },
  messen: { label: 'Messen', icon: 'scale' },
  rueckblick: { label: 'Rückblick', icon: 'trend' },
  sonstiges: { label: 'Sonstiges', icon: 'clock' },
};
export const GOALS: Record<GoalKey, string> = { abnehmen: 'Abnehmen', fitter: 'Fitter werden', bewegung: 'Mehr Bewegung', ernaehrung: 'Bessere Ernährung', werte: 'Gesundheitswerte verbessern', routinen: 'Routinen aufbauen' };
export const PLACES: Record<string, { label: string; title: string; kind: string }> = {
  studio: { label: 'Fitnessstudio', title: 'Krafttraining im Studio', kind: 'Krafttraining' },
  zuhause: { label: 'Zuhause', title: 'Home-Workout', kind: 'Home-Workout' },
  walkingpad: { label: 'Walking-Pad', title: 'Walking-Pad-Einheit', kind: 'Gehen' },
  spazieren: { label: 'Spazierengehen', title: 'Zügiger Spaziergang', kind: 'Gehen' },
  laufen: { label: 'Laufen', title: 'Lauftraining', kind: 'Laufen' },
  rad: { label: 'Radfahren', title: 'Radtour', kind: 'Radfahren' },
  schwimmen: { label: 'Schwimmen', title: 'Schwimmen', kind: 'Schwimmen' },
};
export const HABIT_LIBRARY: Record<string, { name: string; goals: GoalKey[] }> = {
  wasser: { name: 'Zwei Liter Wasser', goals: ['ernaehrung', 'abnehmen', 'werte'] },
  gemuese: { name: 'Gemüse zu einer Hauptmahlzeit', goals: ['ernaehrung', 'werte', 'abnehmen'] },
  getraenke: { name: 'Süße Getränke durch Wasser ersetzen', goals: ['abnehmen', 'ernaehrung'] },
  treppe: { name: 'Treppe statt Aufzug', goals: ['bewegung', 'fitter', 'abnehmen'] },
  abendrunde: { name: 'Kurze Runde nach dem Abendessen', goals: ['bewegung', 'werte'] },
  schlaf: { name: 'Feste Schlafenszeit', goals: ['routinen', 'fitter', 'werte'] },
  bildschirm: { name: 'Bildschirm aus ab 22:30', goals: ['routinen'] },
  vielfalt: { name: 'Zwei Sorten Obst oder Gemüse am Tag', goals: ['ernaehrung', 'werte'] },
};
export const SLOTS: Record<string, string> = { morgens: 'Morgens', mittags: 'Mittags', abends: 'Abends' };
export const INTENSITIES: Record<string, [string, string]> = { sanft: ['Sanft', 'Nur das Wichtigste, höchstens ein Hinweis.'], ausgewogen: ['Ausgewogen', 'Nahe Termine und Fristen, höchstens drei Hinweise.'], deutlich: ['Deutlich', 'Alle offenen Fristen und Termine der nächsten Woche.'] };
export const TONES: Record<string, [string, string]> = { ruhig: ['Ruhig', '1 von 2 Trainingseinheiten erledigt.'], ausgewogen: ['Ausgewogen', '1 von 2 Trainingseinheiten erledigt. Das passt gut in die Woche.'], anspornend: ['Anspornend', '1 von 2 Trainingseinheiten erledigt. Noch 1 bis zum Wochenziel.'] };
export const PAUSE_KINDS: Record<string, string> = { urlaub: 'Urlaub', auszeit: 'Auszeit ohne Grund' };
export const TASK_CLASSES: Record<string, [string, string]> = {
  same_day: ['Tagesgebunden', 'Nur am geplanten Tag sinnvoll. Wird sie verpasst, verfällt sie und wird nicht nachgeholt.'],
  weekly_flexible: ['Wöchentlich flexibel', 'Zählt fürs Wochenziel. Verpasst kannst du sie in derselben Woche ersetzen, danach entsteht kein Rückstand.'],
  deadline: ['Mit Frist', 'Bleibt offen, bis du sie erledigst oder verwirfst. Erinnerung höchstens einmal pro Woche.'],
  optional_logging: ['Optional erfassen', 'Fehlt ein Eintrag, gilt er als nicht erfasst. Keine Aufgabe, kein Rückstand.'],
};
export const PRIORITIES: Record<string, string> = { hoch: 'Hoch', normal: 'Normal', niedrig: 'Niedrig' };
export const STATUS_INFO: Record<string, [string, string, string]> = {
  geplant: ['Geplant', 'clock', ''], erledigt: ['Erledigt', 'check', 'ok'], ausgelassen: ['Bewusst ausgelassen', 'minus', 'muted'],
  verpasst: ['Verpasst', 'x', 'muted'], pausiert: ['Pausiert', 'pause', 'muted'], verschoben: ['Verschoben', 'move', 'muted'],
  faellig: ['Frist abgelaufen', 'flag', 'warn'], nicht_erfasst: ['Nicht erfasst', 'minus', 'muted'],
};
export const FOODS: Food[] = [
  { id: 'oats', name: 'Haferflocken', kcal: 370, p: 13, c: 59, f: 7 },
  { id: 'skyr', name: 'Skyr natur', kcal: 63, p: 11, c: 4, f: 0.2 },
  { id: 'banana', name: 'Banane', kcal: 93, p: 1.2, c: 20, f: 0.2 },
  { id: 'chicken', name: 'Hähnchenbrust, gegart', kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'rice', name: 'Basmatireis, gekocht', kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { id: 'broccoli', name: 'Brokkoli', kcal: 34, p: 2.8, c: 4, f: 0.4 },
  { id: 'bread', name: 'Vollkornbrot', kcal: 220, p: 8, c: 38, f: 2 },
  { id: 'hummus', name: 'Hummus', kcal: 250, p: 7, c: 14, f: 18 },
  { id: 'salmon', name: 'Lachs, gegart', kcal: 208, p: 20, c: 0, f: 13 },
  { id: 'apple', name: 'Apfel', kcal: 52, p: 0.3, c: 14, f: 0.2 },
  { id: 'potato', name: 'Kartoffeln, gekocht', kcal: 86, p: 2, c: 18, f: 0.1 },
  { id: 'egg', name: 'Ei, gekocht', kcal: 155, p: 13, c: 1, f: 11 },
  { id: 'lentils', name: 'Linsen, gekocht', kcal: 116, p: 9, c: 20, f: 0.4 },
  { id: 'chickpeas', name: 'Kichererbsen, gekocht', kcal: 164, p: 8.9, c: 27, f: 2.6 },
  { id: 'blueberries', name: 'Heidelbeeren', kcal: 57, p: 0.7, c: 14, f: 0.3 },
  { id: 'walnuts', name: 'Walnüsse', kcal: 654, p: 15, c: 14, f: 65 },
  { id: 'pumpkinseeds', name: 'Kürbiskerne', kcal: 559, p: 30, c: 11, f: 49 },
  { id: 'rapeseedoil', name: 'Rapsöl', kcal: 884, p: 0, c: 0, f: 100 },
];
export const IDEA_FOODS: string[] = ['oats', 'lentils', 'chickpeas', 'blueberries', 'walnuts', 'pumpkinseeds', 'rapeseedoil'];
export const MEALS: string[] = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];
export const MAIN_MEALS: string[] = ['Frühstück', 'Mittagessen', 'Abendessen'];
export const WORKOUT_KINDS: string[] = ['Krafttraining', 'Home-Workout', 'Laufen', 'Gehen', 'Radfahren', 'Schwimmen', 'Yoga', 'Sonstiges'];
export const INTENSITY: string[] = ['leicht', 'moderat', 'fordernd', 'hart', 'maximal'];
export const APPT_STATUS: Record<string, string> = { offen: 'Offen', vereinbart: 'Vereinbart', erledigt: 'Erledigt', aufgeschoben: 'Aufgeschoben' };
export const REVIEW_STATUS: Record<string, string> = { offen: 'Offen', verschoben: 'Verschoben', uebersprungen: 'Übersprungen', abgeschlossen: 'Abgeschlossen' };
export const COVERAGE_LABEL: Record<Coverage, string> = { vollstaendig: 'vollständig erfasst', laufend: 'läuft noch', teilweise: 'unvollständig erfasst', keine: 'keine Daten', pausiert: 'pausiert', zukunft: 'noch nicht begonnen' };
export const ITEM_STATUSES: ItemStatus[] = ['geplant', 'erledigt', 'ausgelassen', 'verpasst', 'pausiert', 'verschoben', 'nicht_erfasst'];
export const EVIDENCE: Record<string, { title: string; publisher: string; date: string; url: string; note: string }> = {
  aha2026: { title: '2026 Dietary Guidance to Improve Cardiovascular Health', publisher: 'American Heart Association, Circulation', date: '31.03.2026', url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001435', note: 'Wissenschaftliches Statement. Betont Ernährungsmuster statt einzelner Lebensmittel oder Nährstoffe.' },
  esc2025: { title: '2025 Focused Update of the 2019 ESC/EAS Guidelines for the management of dyslipidaemias', publisher: 'ESC und EAS, European Heart Journal', date: '29.08.2025', url: 'https://doi.org/10.1093/eurheartj/ehaf190', note: 'Leitlinie. Rät von Nahrungsergänzungsmitteln ohne belegte Sicherheit und LDL-senkende Wirksamkeit ab.' },
  who2020: { title: 'WHO guidelines on physical activity and sedentary behaviour (Zusammenfassung)', publisher: 'WHO, British Journal of Sports Medicine', date: '2020', url: 'https://doi.org/10.1136/bjsports-2020-102955', note: 'Sitzzeit begrenzen und durch Bewegung jeder Intensität ersetzen. Laut WHO starke Empfehlung bei mittlerer Evidenzsicherheit.' },
  dge2021: { title: 'FAQ Ballaststoffe', publisher: 'Deutsche Gesellschaft für Ernährung (DGE)', date: '2021', url: 'https://www.dge.de/fileadmin/dok/gesunde-ernaehrung/faq/DGE-FAQ-Ballaststoffe-2021.pdf', note: 'Richtwert für Erwachsene: mindestens 30 g Ballaststoffe pro Tag.' },
  odszinc: { title: 'Zinc, Fact Sheet for Health Professionals', publisher: 'NIH Office of Dietary Supplements', date: 'Aktualisierungsdatum nicht geprüft', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/', note: 'Lebensmittelquellen für Zink und Einordnung von Serumwerten.' },
  odscopper: { title: 'Copper, Fact Sheet for Health Professionals', publisher: 'NIH Office of Dietary Supplements', date: 'Aktualisierungsdatum nicht geprüft', url: 'https://ods.od.nih.gov/factsheets/Copper-HealthProfessional/', note: 'Zusammenhang zwischen hohen Zinkgaben und Kupferversorgung.' },
};
export const EVIDENCE_LEVELS: Record<string, [string, string]> = { gut: ['Gut belegt', 'Durch Leitlinien oder große Übersichtsarbeiten gestützt.'], begrenzt: ['Begrenzt belegt', 'Hinweise vorhanden, aber nicht eindeutig.'], unklar: ['Unklar', 'Keine belastbare direkte Empfehlung.'] };
export const REC_STATUS: Record<string, string> = { vorgeschlagen: 'Vorgeschlagen', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt', abgeschlossen: 'Abgeschlossen' };
export const DEFAULT_CONFIG: Config = {
  schema: SCHEMA, onboardingDone: false, skipped: false,
  goals: ['fitter', 'bewegung'],
  work: { days: [0, 1, 2, 3, 4], home: [0, 4], start: '08:30', end: '17:30', lunch: '12:30', lunchDur: 30 },
  breaks: { perDay: 1, duration: 15 },
  training: { places: ['studio', 'rad', 'spazieren'], perWeek: 2, days: [1, 5], slot: 'abends', duration: 60, freeDay: true },
  nutrition: { calories: true, weight: false, weightPerWeek: 2, habitsFirst: false },
  habits: ['wasser', 'treppe', 'bildschirm'],
  reminders: { intensity: 'ausgewogen', lead: 15, quietFrom: '22:00', quietTo: '07:00' },
  motivation: 'ausgewogen',
  review: { weeklyDay: 6, weeklyTime: '18:00', monthly: true },
};
