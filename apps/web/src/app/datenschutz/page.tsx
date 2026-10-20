import Link from 'next/link';
import '../legal.css';
export const metadata = { title: 'Datenschutz · HealthOS' };
export default function Datenschutz() {
  return <main className="legal">
    <p><Link href="/">Zurück zu HealthOS</Link></p>
    <h1>Datenschutzerklärung</h1>
    <p className="draft">Entwurf für die geschlossene Beta, rechtlich nicht geprüft. Die markierten Stellen müssen ergänzt und vor der Einladung von Testern geprüft werden.</p>
    <h2>Verantwortlich</h2>
    <p><span className="todo">Name und Anschrift wie im Impressum</span>, E-Mail: <span className="todo">Kontaktadresse</span></p>
    <h2>Welche Daten HealthOS verarbeitet</h2>
    <p>Für dein Konto: E-Mail-Adresse und Passwort (verschlüsselt gespeichert). In der App: Ziele, Arbeitszeiten und Einstellungen, Routinen und Wochenplan mit Status, Gewohnheiten und deren Haken, Pausen ohne Grund, Reviews mit gewählten Maßnahmen ohne deine Antworten, erfasste Trainingseinheiten und Schritte. Gewicht, Mahlzeiten, Blutwerte, Arzttermine und Dokumente werden in der Beta nicht verarbeitet.</p>
    <p>Diese Angaben können Rückschlüsse auf deine Gesundheit zulassen und gelten dann als besondere Kategorien personenbezogener Daten.</p>
    <h2>Zweck und Rechtsgrundlage</h2>
    <p>Die Daten werden ausschließlich verarbeitet, um dir die Funktionen von HealthOS bereitzustellen. Rechtsgrundlage ist deine ausdrückliche Einwilligung (Art. 6 Abs. 1 lit. a und Art. 9 Abs. 2 lit. a DSGVO), die du beim ersten Start erteilst. <span className="todo">Rechtsgrundlagen prüfen lassen</span></p>
    <h2>Dienstleister und Speicherort</h2>
    <p>Datenbank und Anmeldung: Supabase, Rechenzentrum in London (Vereinigtes Königreich). Bereitstellung der App-Dateien: Vercel. Die App-Dateien enthalten keine persönlichen Daten, deine Daten gehen direkt zwischen deinem Gerät und Supabase. <span className="todo">Auftragsverarbeitungsverträge, Unterauftragnehmer und Rechtsgrundlage der Übermittlung nach Großbritannien prüfen und ergänzen</span></p>
    <h2>Speicherdauer und Löschung</h2>
    <p>Deine Daten bleiben gespeichert, bis du sie löschst. In den Einstellungen kannst du alle gespeicherten Daten jederzeit löschen. Die Löschung des Kontos selbst erfolgt auf Anfrage per E-Mail. Sicherungskopien des Dienstleisters werden nach dessen Fristen überschrieben. <span className="todo">Frist ergänzen</span></p>
    <h2>Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit (Export in den Einstellungen) und Widerruf deiner Einwilligung mit Wirkung für die Zukunft, außerdem das Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde.</p>
    <h2>Keine Weitergabe, keine Werbung</h2>
    <p>Es gibt keine Werbung, kein Tracking und keine Weitergabe an Dritte zu eigenen Zwecken. Es werden keine Cookies zu Analysezwecken gesetzt. Für die Anmeldung speichert der Browser eine Sitzung lokal.</p>
  </main>;
}
