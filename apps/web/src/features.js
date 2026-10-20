// Funktionsumfang der geschlossenen Beta. Gesundheitsnahe Bereiche bleiben aus, bis Datenschutz und Sicherheit geprüft sind.
// Die Entwicklungs-Demo (NEXT_PUBLIC_HEALTHOS_MODE=demo) zeigt fiktive Daten und speichert nur im Browser.
const mode = process.env.NEXT_PUBLIC_HEALTHOS_MODE || 'demo';
export const MODE = mode; // 'demo' | 'beta'
export const FEATURES = {
  demoData: mode === 'demo',
  healthTab: false,          // Blutwerte, Termine, Empfehlungen
  recs: false,               // Health Intelligence und Empfehlungs-Maßnahmen
  weight: false,             // Gewicht
  appointments: false,       // Arzttermine und Vorsorge
  capture: ['training', 'schritte'],
  hiddenGoals: ['werte'],    // Ziel „Blutwerte“ bezieht sich auf Laborwerte
  persistActivity: true,     // Trainingseinheiten und Schritte werden gespeichert
  pill: mode === 'demo' ? 'Demo, fiktive Daten' : 'Geschlossene Beta',
  captureNote: mode === 'demo'
    ? 'Entwicklungs-Demo: Daten bleiben nur in diesem Browser. Bitte nur fiktive Werte eingeben.'
    : 'Erfasst werden nur Training und Schritte. Gewicht, Mahlzeiten und Blutwerte sind in der Beta ausgeschaltet.',
  storageText: mode === 'demo'
    ? 'Entwicklungs-Demo: Einstellungen, Routinen, Wochenplan, Gewohnheiten, Pausen ohne Grund, Training und Schritte bleiben nur in diesem Browser.'
    : 'Gespeichert werden Einstellungen, Routinen mit Versionen, Wochenplan mit Status, Gewohnheiten, Pausen ohne Grund, Reviews ohne Antworten sowie Training und Schritte, privat für dein Konto in der EU. Nicht gespeichert werden Gewicht, Mahlzeiten, Blutwerte, Termine und Dokumente.',
};

/** Beschränkt Einstellungen auf den Beta-Umfang: keine Kalorien- und Gewichtserfassung, keine ausgeblendeten Ziele. */
FEATURES.restrictConfig = cfg => ({
  ...cfg,
  goals: cfg.goals.filter(g => !FEATURES.hiddenGoals.includes(g)),
  nutrition: { ...cfg.nutrition, calories: FEATURES.capture.includes('mahlzeit') ? cfg.nutrition.calories : false, weight: FEATURES.weight ? cfg.nutrition.weight : false },
});

/** Texte im Info-Dialog der Beta. */
FEATURES.info = {
  works: 'Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken, Verschieben, Ersatz in derselben Woche, Pausen, Gewohnheiten, Training und Schritte erfassen, Wochen- und Monatsreviews mit Maßnahmen.',
  stored: 'Einstellungen, Routinen, Wochenplan, Gewohnheiten, Pausen ohne Grund, Reviews ohne Antworten sowie Training und Schritte, privat für dein Konto. Gewicht, Mahlzeiten, Blutwerte, Termine und Dokumente sind ausgeschaltet.',
  missing: 'Keine Push-Benachrichtigungen, kein Datei-Upload, keine Verbindung zu Health Connect, keine KI-Auswertung, keine medizinischen Empfehlungen.',
};

// Ziel „Abnehmen“ bezieht sich auf Gewicht, das in der Beta nicht erfasst wird (Review vom 20.10.2026).
FEATURES.hiddenGoals = ['werte', 'abnehmen'];

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
  { key: 'sporttasche', name: 'Sporttasche am Vorabend packen', when: 'abends' },
  { key: 'protein-frueh', name: 'Proteinquelle zum Frühstück', when: 'morgens' },
  { key: 'snack-teller', name: 'Snacks auf einen Teller statt aus der Packung', when: 'bei Snacks' },
  { key: 'abendessen-frueh', name: 'Abendessen 2 Stunden vor dem Schlafen', when: 'abends' },
  { key: 'handy-raus', name: 'Handy außerhalb des Schlafzimmers laden', when: 'abends' },
  { key: 'tag-planen', name: 'Morgens festlegen: Was ist heute meine Bewegung?', when: 'morgens' },
  { key: 'alkoholfrei', name: 'Alkoholfreier Abend', when: 'abends' },
  { key: 'woche-planen', name: 'Trainingstermine der Woche festlegen', when: 'sonntags' },
];
