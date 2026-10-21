/**
 * Domänentypen des HealthOS-Fachkerns.
 * Abgeleitet aus den Datenstrukturen der Referenz v5. Datumsangaben sind lokale Kalendertage
 * in Europe/Berlin im Format JJJJ-MM-TT, Uhrzeiten lokale Zeiten im Format HH:MM.
 */

/** Lokaler Kalendertag, z. B. "2026-10-19" */
export type ISODate = string;
/** Lokale Uhrzeit, z. B. "18:30" */
export type HHMM = string;
/** Wochentag 0 = Montag … 6 = Sonntag */
export type Weekday = number;

export type GoalKey = 'abnehmen' | 'fitter' | 'bewegung' | 'ernaehrung' | 'werte' | 'routinen';
export type ItemType = 'training' | 'bewegung' | 'ernaehrung' | 'messen' | 'rueckblick' | 'sonstiges';
export type TaskClass = 'same_day' | 'weekly_flexible' | 'deadline' | 'optional_logging';
export type Priority = 'hoch' | 'normal' | 'niedrig';
export type ItemStatus = 'geplant' | 'erledigt' | 'ausgelassen' | 'verpasst' | 'pausiert' | 'verschoben' | 'nicht_erfasst';
export type EffectiveStatus = ItemStatus | 'faellig';
export type RoutineStatus = 'aktiv' | 'pausiert' | 'archiviert';
export type RoutineSource = 'plan' | 'eigene' | 'empfehlung';
export type PauseKind = 'urlaub' | 'auszeit';
export type PauseScope = 'alle' | 'training';
export type HabitMark = 'done' | 'skip';
export type Intensity = 'sanft' | 'ausgewogen' | 'deutlich';
export type Tone = 'ruhig' | 'ausgewogen' | 'anspornend';
export type Slot = 'morgens' | 'mittags' | 'abends';
export type RecStatus = 'vorgeschlagen' | 'angenommen' | 'abgelehnt' | 'abgeschlossen';
export type EvidenceLevel = 'gut' | 'begrenzt' | 'unklar';
export type ReviewKind = 'week' | 'month';
export type ReviewStatus = 'offen' | 'verschoben' | 'uebersprungen' | 'abgeschlossen';
export type MeasureDecision = 'übernommen' | 'nicht jetzt';
export type Coverage = 'vollstaendig' | 'laufend' | 'teilweise' | 'keine' | 'pausiert' | 'zukunft';

/* ---------- Konfiguration ---------- */
export interface Config {
  schema: number;
  onboardingDone: boolean;
  skipped: boolean;
  goals: GoalKey[];
  work: { days: Weekday[]; home: Weekday[]; start: HHMM; end: HHMM; lunch: HHMM; lunchDur: number };
  breaks: { perDay: number; duration: number };
  training: { places: string[]; perWeek: number; days: Weekday[]; slot: Slot | string; duration: number; freeDay: boolean };
  nutrition: { calories: boolean; weight: boolean; weightPerWeek: number; habitsFirst: boolean };
  habits: string[];
  reminders: { intensity: Intensity; lead: number; quietFrom: HHMM; quietTo: HHMM };
  motivation: Tone;
  review: { weeklyDay: Weekday; weeklyTime: HHMM; monthly: boolean };
}

/* ---------- Plan ---------- */
export interface PlanRoutine {
  key: string; title: string; kind?: string | null; type: ItemType; days: Weekday[]; time: HHMM; duration: number; note: string;
  taskClass: TaskClass; goal: GoalKey | null; priority: Priority;
}
export interface Plan {
  routines: PlanRoutine[];
  freeDay: Weekday | null | undefined;
  tdays: Weekday[];
  notes: string[];
  warn: string[];
  summary: { trainings: number; pauses: number; activeMin: number };
}

/* ---------- Routinen ---------- */
export interface RoutineVersion {
  validFrom: ISODate; title: string; kind?: string | null; days: Weekday[]; time: HHMM; duration: number; note?: string; interval?: number;
}
export interface RoutineException { id: string; weekday: Weekday; validFrom: ISODate; time?: HHMM | null; duration?: number | null }
export interface HistoryEntry { at: ISODate; text: string }
export interface Routine {
  id: string;
  source: RoutineSource;
  customized?: boolean;
  status: RoutineStatus;
  type: ItemType;
  goal?: GoalKey | null;
  taskClass: TaskClass;
  priority: Priority;
  versions: RoutineVersion[];
  exceptions?: RoutineException[];
  history?: HistoryEntry[];
  pausedSince?: ISODate;
  archivedFrom?: ISODate;
}
export interface Spec { title: string; kind: string | null; time: HHMM; duration: number; note: string; exceptionId: string | null }

/* ---------- Plan-Einträge ---------- */
export interface Item {
  id: string;
  routine: string | null;
  title: string;
  type: ItemType | string;
  kind?: string | null;
  date: ISODate;
  time: HHMM | '' | null;
  duration: number | null;
  note?: string;
  status: ItemStatus;
  taskClass?: TaskClass;
  priority?: Priority;
  goal?: GoalKey | null;
  movedFrom?: ISODate;
  movedTo?: ISODate;
  replaces?: string;
  replacedBy?: string;
  override?: boolean;
  lateLogged?: boolean;
  pauseId?: string;
  fromRec?: string;
  sessionOnly?: boolean;
}

export interface Pause { id: string; kind: PauseKind; from: ISODate; to: ISODate; scope: PauseScope }
/** Pause einschließlich der aus pausierten Routinen abgeleiteten Pausen */
export interface EffectivePause { id: string; from: ISODate; to: ISODate; scope: PauseScope | 'routine'; routineId?: string; kind?: PauseKind }

export interface Habit { id: string; name: string; lib?: string; active?: boolean; pinned?: boolean; custom?: boolean; inactiveFrom?: ISODate; /** Ziel pro Woche (1 bis 6). Ohne Angabe täglich. */ perWeek?: number;
  /** W12: „limit“ = Gewohnheit, die begrenzt werden soll. Haken bedeutet „heute passiert“. */ kind?: 'limit';
  /** W12: höchstens so oft pro Woche (0 bis 6), nur bei kind „limit“. */ limitPerWeek?: number;
  /** W12: Auslöser, zum Beispiel „nach dem Mittagessen“, und Tageszeit für die Sortierung. */ trigger?: string; daytime?: 'morgens' | 'mittags' | 'abends';
  /** W12: Alternative, die statt der begrenzten Gewohnheit helfen soll. */ alternative?: string;
  /** W13: Experiment mit Laufzeit und Kriterium. Entscheidung am Ende: behalten oder beenden. */ experiment?: Experiment }
export interface Experiment { from: ISODate; days: number; minDays: number; decision?: 'behalten' | 'beendet'; decidedAt?: ISODate }
export type HabitLog = Record<string, HabitMark>;

/* ---------- Erfassen (in der Referenz nur fiktive Demo-Daten) ---------- */
export interface Workout { id: string; date: ISODate; kind: string; duration: number | null; intensity: number | null; counts: boolean; itemId?: string; source: string; note?: string }
export interface Weight { id: string; date: ISODate; time: HHMM | ''; kg: number; note: string; source: string }
export interface Steps { id: string; date: ISODate; count: number; source: string }
export interface Food { id: string; name: string; kcal: number; p: number; c: number; f: number; fav?: boolean; custom?: boolean }
export interface Nutrients { kcal: number; p: number; c: number; f: number }
export interface Meal { id: string; date: ISODate; meal: string; name: string; qty: number; unit: string; snap: Nutrients; source: string }
export interface FavMeal { id: string; name: string; items: [string, number][] }
export interface Lab { id: string; analyte: string; value: number; unit: string; refMin: number | null; refMax: number | null; date: ISODate; lab: string; source: string; confirmed: boolean }
export interface Appointment { id: string; title: string; practice: string; date: ISODate; time: HHMM | ''; status: 'offen' | 'vereinbart' | 'erledigt' | 'aufgeschoben'; link: string; note: string }

/* ---------- Empfehlungen ---------- */
export interface RecStateEntry {
  status?: RecStatus; firstShown?: ISODate | null; remindAfter?: ISODate | null; primaryOn?: ISODate | null; decidedAt?: ISODate | null;
  reviewDate?: ISODate | null; target?: string | null; takeKind?: string;
}
export type RecState = Record<string, RecStateEntry>;

/* ---------- Reviews ---------- */
export interface MeasureMetric { type: 'training' | 'pauses' | 'habits' | 'routine'; target: number; routine?: string }
export interface MeasureRecord {
  id: string; title: string; area: string; check: string; metric: MeasureMetric | null; decision: MeasureDecision;
  decidedAt: ISODate | null; validFrom: ISODate | null; sig?: string | null; lab?: boolean;
}
export interface ReviewRecord {
  kind: ReviewKind; status: ReviewStatus; at?: ISODate | null; snoozedUntil?: ISODate | null; questionIds?: string[];
  measures?: MeasureRecord[]; mode?: 'voll' | 'kurz' | null; combined?: boolean; demo?: boolean;
}
export type Reviews = Record<string, ReviewRecord>;

/* ---------- Gesamtzustand ---------- */
export interface State {
  routines: Routine[];
  items: Item[];
  workouts: Workout[];
  weights: Weight[];
  steps: Steps[];
  foods: Food[];
  favMeals: FavMeal[];
  meals: Meal[];
  labs: Lab[];
  appointments: Appointment[];
  habits: Habit[];
  habitLog: HabitLog;
  dismissed: string[];
  pauses: Pause[];
  recState: RecState;
  reviews: Reviews;
}

/** Unbekannte externe Daten (Import, gespeicherte Stände) */
export type Unknown = unknown;
