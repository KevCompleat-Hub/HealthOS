import Link from 'next/link';
import '../legal.css';
export const metadata = { title: 'Impressum · HealthOS' };
export default function Impressum() {
  return <main className="legal">
    <p><Link href="/">Zurück zu HealthOS</Link></p>
    <h1>Impressum</h1>
    <p className="draft">Entwurf. Die markierten Angaben müssen vor der Einladung von Testern ergänzt und geprüft werden.</p>
    <h2>Angaben</h2>
    <p><span className="todo">Vor- und Nachname</span><br /><span className="todo">Straße und Hausnummer</span><br /><span className="todo">PLZ und Ort</span></p>
    <h2>Kontakt</h2>
    <p>E-Mail: <span className="todo">Kontaktadresse</span></p>
    <h2>Hinweis</h2>
    <p>HealthOS ist ein privates, nicht kommerzielles Testprojekt in einer geschlossenen Beta. Es ersetzt keine ärztliche Beratung und gibt keine medizinischen Empfehlungen.</p>
  </main>;
}
