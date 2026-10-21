# EvoVive Markenauftritt (ab 0.13.0-w15, vorher HealthOS)

Sichtbare Schreibweise: **EvoVive**. Name aus Evolution (persönliche Weiterentwicklung) und Vive (Leben, Vitalität).
Vorläufiger Claim, nicht automatisch eingebaut: „Better habits. Better health.“
Marken- und Namensrechte sind **nicht geprüft**. Es wird keine rechtliche Verfügbarkeit behauptet.

## Symbol und Wortmarke
- Symbol: zwei Blätter als aufsteigendes „V“ (Wachstum, Vitalität) mit einem Punkt (Energie) auf Waldgrün. Reproduzierbar mit `python3 tools/brand/make-icons.py`.
- Dateien: `apps/web/public/icons/evovive.svg`, `evovive-16/32/192/512.png`, `evovive-512-maskable.png`, `evovive-apple-touch.png`. Neue Dateinamen, damit Geräte nicht das alte, zwischengespeicherte Icon behalten.
- Wortmarke: „Evo“ in Textfarbe, „Vive“ in Waldgrün, Schrift Schibsted Grotesk Semibold.

## Farben (Hell-Modus, Dunkel-Modus unverändert)
| Token | Wert | Verwendung |
| --- | --- | --- |
| `--primary` | `#24543F` Waldgrün | Knöpfe, Wortmarke, Fortschritt |
| `--sage` | `#8FB39A` Salbei | Akzente |
| `--gold` | `#E6B95C` | Erfolgsmomente, Punkt im Symbol |
| `--bg` | `#F3F1EA` warmes Hell | Hintergrund |
| `--surface` | `#FCFBF7` | Karten |

## Bewusst unverändert (intern, nicht sichtbar)
| Stelle | Grund |
| --- | --- |
| Paketnamen `@healthos/web`, `@healthos/domain`, Ordner und Dateinamen wie `HealthOSApp.jsx` | interne Bezeichner, Umbenennung ohne Nutzen und mit Risiko |
| Exportformat `healthos-beta-export`, `healthos-export` | Kompatibilität: ältere Exportdateien bleiben importierbar |
| Umgebungsvariable `NEXT_PUBLIC_HEALTHOS_MODE` | würde Änderung in Vercel erfordern |
| Supabase- und Vercel-Kennungen, URL `health-os-five-azure.vercel.app` | Infrastruktur bleibt laut Auftrag |
| Meldung „keine HealthOS-Exportdatei“ im Fachkern | Parität zur Referenz; die Oberfläche zeigt sie als „EvoVive“ an |
| Kommentare in Code, Migrationen, Tests und ältere Dokumente | Historie, nicht sichtbar |

Prüfung: `node tools/brand-check.mjs` nach `next build` durchsucht Seiten, Skripte, Manifest, Service Worker und Offline-Seite.
