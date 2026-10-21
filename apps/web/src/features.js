// Funktionsumfang der geschlossenen Beta. Gesundheitsnahe Bereiche bleiben aus, bis Datenschutz und Sicherheit geprüft sind.
// Die Entwicklungs-Demo (NEXT_PUBLIC_HEALTHOS_MODE=demo) zeigt fiktive Daten und speichert nur im Browser.
const mode = process.env.NEXT_PUBLIC_HEALTHOS_MODE || 'demo';
export const MODE = mode; // 'demo' | 'beta'
export const FEATURES = {
  demoData: mode === 'demo',
  healthTab: false,          // Blutwerte, Termine, Empfehlungen
  recs: false,               // Health Intelligence und Empfehlungs-Maßnahmen
  weight: true,              // Gewicht und Körperwerte, mit eigener Einwilligung (beta-2), Entscheidung E-11
  appointments: false,       // Arzttermine und Vorsorge
  capture: ['training', 'schritte', 'gewicht', 'mahlzeit'],
  hiddenGoals: ['werte'],    // Ziel „Blutwerte“ bezieht sich auf Laborwerte
  persistActivity: true,     // Trainingseinheiten und Schritte werden gespeichert
  pill: mode === 'demo' ? 'Demo, fiktive Daten' : 'Geschlossene Beta',
  captureNote: mode === 'demo'
    ? 'Entwicklungs-Demo: Daten bleiben nur in diesem Browser. Bitte nur fiktive Werte eingeben.'
    : 'Erfasst werden Training, Schritte und Gewicht. Mahlzeiten und Blutwerte sind in der Beta ausgeschaltet.',
  storageText: mode === 'demo'
    ? 'Entwicklungs-Demo: Einstellungen, Routinen, Wochenplan, Gewohnheiten, Pausen ohne Grund, Training, Schritte und Gewicht bleiben nur in diesem Browser.'
    : 'Gespeichert werden deine Einstellungen, dein Wochenplan mit Routinen, deine Gewohnheiten und Pausen (ohne Angabe eines Grundes), die Ergebnisse deiner Reviews (nicht deine Antworten), Trainings, Schritte, Gewicht und Körperwerte. Alles nur für dein Konto, auf Servern in Frankfurt. Nicht gespeichert werden Mahlzeiten, Blutwerte, Arzttermine und Dokumente.',
};

/** Beschränkt Einstellungen auf den Beta-Umfang: keine Kalorien- und Gewichtserfassung, keine ausgeblendeten Ziele. */
FEATURES.restrictConfig = cfg => ({
  ...cfg,
  goals: cfg.goals.filter(g => !FEATURES.hiddenGoals.includes(g)),
  nutrition: { ...cfg.nutrition, calories: false, // Kalorien sind ein eigenes Opt-in in der Mahlzeiten-Erfassung (mealPrefs.showKcal), Standard aus
    weight: FEATURES.weight ? cfg.nutrition.weight : false },
});

/** Texte im Info-Dialog der Beta. */
FEATURES.info = {
  works: 'Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken, Verschieben, Ersatz in derselben Woche, Pausen, Gewohnheiten, Training und Schritte erfassen, Wochen- und Monatsreviews mit Maßnahmen.',
  stored: 'Einstellungen, Routinen, Wochenplan, Gewohnheiten, Pausen ohne Grund, Reviews ohne Antworten sowie Training, Schritte sowie Gewicht und Körperwerte, privat für dein Konto. Mahlzeiten, Blutwerte, Termine und Dokumente sind ausgeschaltet.',
  missing: 'Funktionsstand dieser Version: siehe Liste unten.',
};

// Ziel „Abnehmen“ bezieht sich auf Gewicht, das in der Beta nicht erfasst wird (Review vom 20.10.2026).
FEATURES.hiddenGoals = ['werte']; // „Abnehmen“ ist mit Gewicht wieder dabei (Entscheidung E-11)

/** Feedback und Rechtstexte. Adresse über die Umgebungsvariable NEXT_PUBLIC_FEEDBACK_EMAIL. */
FEATURES.feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || '';

/** Ideen für Gewohnheiten mit festem Auslöser. Werden als eigene Gewohnheiten angelegt, ohne Gesundheitsaussage. */
FEATURES.habitIdeas = [
  { key: 'wasser-morgens', name: 'Glas Wasser nach dem Aufstehen', when: 'morgens' },
  { key: 'flasche', name: 'Wasserflasche am Arbeitsplatz auffüllen', when: 'zum Arbeitsbeginn' },
  { key: 'gehen-mittag', name: '10 Minuten gehen nach dem Mittagessen', when: 'mittags' },
  { key: 'telefon-gehen', name: 'Telefonate im Gehen führen', when: 'bei Anrufen' },
  { key: 'mobilisieren', name: '2 Minuten dehnen nach dem Aufstehen', when: 'morgens' },
  { key: 'tageslicht', name: '10 Minuten Tageslicht vor 12 Uhr', when: 'vormittags' },
  { key: 'sporttasche', name: 'Sporttasche am Vorabend packen', when: 'vor Trainingstagen', perWeek: 2 },
  { key: 'protein-frueh', name: 'Proteinquelle zum Frühstück', when: 'morgens' },
  { key: 'snack-teller', name: 'Snacks auf einen Teller statt aus der Packung', when: 'bei Snacks' },
  { key: 'abendessen-frueh', name: 'Abendessen 2 Stunden vor dem Schlafen', when: 'abends' },
  { key: 'handy-raus', name: 'Handy außerhalb des Schlafzimmers laden', when: 'abends' },
  { key: 'tag-planen', name: 'Morgens festlegen: Was ist heute meine Bewegung?', when: 'morgens' },
  { key: 'alkoholfrei', name: 'Alkoholfreier Abend', when: 'abends', perWeek: 3 },
  { key: 'woche-planen', name: 'Trainingstermine der Woche festlegen', when: 'sonntags', perWeek: 1 },
];

/** KI-Auswertung von Waagen-Screenshots anzeigen. Aktiv nur, wenn der Server einen API-Schlüssel hat (NEXT_PUBLIC_SCALE_AI=on). */
FEATURES.scaleAi = process.env.NEXT_PUBLIC_SCALE_AI === 'on';

/** Ernährungs-Ideen und Zutaten-Katalog (allgemeine Lebensmittelauswahl, Entscheidung E-12). */
FEATURES.foodGuide = true;

/** KI-Rezeptideen, gleiche Freischaltung wie die Screenshot-Auswertung (NEXT_PUBLIC_SCALE_AI=on). */
FEATURES.aiRecipes = FEATURES.scaleAi;

/** Zentraler Funktionsstatus. Info-Texte werden daraus erzeugt, damit nie etwas versprochen wird, das nicht eingerichtet ist (Audit P1-07). */
FEATURES.status = [
  ['Push-Erinnerungen', 'verfügbar, auf dem iPhone nur als Home-Bildschirm-App'],
  ['Waagen-Screenshot und Rezeptideen per KI', FEATURES.scaleAi ? 'verfügbar, nur mit eigener Einwilligung' : 'in Einrichtung'],
  ['Ernährung', 'Ideen und Zutaten-Katalog, keine Kalorien- oder Mahlzeitenerfassung'],
  ['Blutwerte, Arzttermine, Dokumente, medizinische Empfehlungen', 'in der Beta ausgeschaltet'],
  ['Health Connect und Wearables', 'geplant, noch nicht verfügbar'],
];
FEATURES.info.missing = FEATURES.status.map(([k, v]) => `${k}: ${v}.`).join(' ');
FEATURES.info.works = 'Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken, Auslassen, Verschieben, Ersatz in derselben Woche, Pausen, Gewohnheiten mit Häufigkeit, Training, Schritte und Gewicht erfassen, Wochen- und Monatsreviews mit Maßnahmen, Push-Erinnerungen.';
/** Sichtbarer Versionsstand (Audit: Release-Kennzeichnung). */
FEATURES.version = process.env.NEXT_PUBLIC_APP_VERSION || 'Entwicklung';
/** Kurze Erklärung der Ziele im Onboarding (Audit P2). */
FEATURES.goalHint = '„Fitter werden“ heißt Kondition und Kraft durch Training. „Mehr Bewegung“ heißt weniger Sitzen und mehr Alltagsbewegung. Beides zusammen ist möglich. Die Reihenfolge bestimmt, worauf die App zuerst achtet.';

/** Begriffe, im Info-Dialog erklärt (Audit P1-02). */
FEATURES.terms = [
  ['Termin', 'Ein Eintrag mit Tag und Uhrzeit, zum Beispiel Training am Mittwoch um 18:30.'],
  ['Routine', 'Die Regel, die Termine erzeugt, zum Beispiel „Krafttraining jeden Mittwoch“. Änderst du eine Routine, ändern sich die künftigen Termine.'],
  ['Gewohnheit', 'Etwas, das du täglich oder einige Male pro Woche tust, ohne feste Uhrzeit. Du hakst sie einfach ab.'],
  ['Messung', 'Werte, die du erfasst: Gewicht, Schritte, Trainingseinheiten.'],
];
/** Onboarding auf 4 Schritte: Pausen, Ernährung und Erinnerungen nutzen Voreinstellungen und bleiben in den Einstellungen änderbar. */
FEATURES.obSkip = ['pausen', 'ernaehrung', 'erinnerungen'];

// W12: Ideen mit Auslöser und Tageszeit sowie Gewohnheiten zum Begrenzen (mit Alternative).
FEATURES.habitIdeas.forEach(x => { const t = { 'wasser-morgens': ['nach dem Aufstehen', 'morgens'], 'gehen-mittag': ['nach dem Mittagessen', 'mittags'], 'mobilisieren': ['nach dem Aufstehen', 'morgens'], 'sporttasche': ['am Vorabend', 'abends'], 'handy-raus': ['vor dem Schlafengehen', 'abends'], 'tag-planen': ['beim ersten Kaffee', 'morgens'], 'tageslicht': ['in der Mittagspause', 'mittags'] }[x.key]; if (t) { x.trigger = t[0]; x.daytime = t[1]; } });
FEATURES.habitIdeas.push(
  { key: 'snack-abends', name: 'Abends snacken', when: 'begrenzen', limit: 2, alternative: 'Tee kochen oder Zähne putzen', daytime: 'abends' },
  { key: 'suesses-getraenk', name: 'Süßes Getränk', when: 'begrenzen', limit: 2, alternative: 'Sprudel mit Zitrone' },
  { key: 'handy-bett', name: 'Handy im Bett', when: 'begrenzen', limit: 1, alternative: 'Buch statt Handy', daytime: 'abends' },
);

/** Paket D (W14): Befinden und Tags mit eigener Einwilligung beta-3. */
FEATURES.checkins = true;
FEATURES.status.splice(3, 0, ['Befinden (Stimmung, Energie, Stress, Schlaf) und Tags wie Krankheit', 'verfügbar, nur mit eigener Einwilligung']);
FEATURES.status.push(['Mahlzeiten mit Nährwerten aus dem Bundeslebensmittelschlüssel, Ziele für Eiweiß und Ballaststoffe', 'verfügbar']);
