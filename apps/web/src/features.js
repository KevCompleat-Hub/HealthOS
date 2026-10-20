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
