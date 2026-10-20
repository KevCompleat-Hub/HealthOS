// Zutaten-Katalog für HealthOS. Allgemeine Lebensmittelauswahl, keine Therapie, keine Nahrungsergänzung, keine Dosierung.
// Aussagen je Gruppe stützen sich auf die unten genannten Quellen (am 21.10.2026 per Websuche geprüft).
// Einzelne Nährstoffangaben sind bewusst qualitativ formuliert (zum Beispiel „eiweißreich“), ohne Zahlen pro 100 g.

export const FOOD_SOURCES = {
  dge2024: { title: 'Gut essen und trinken, die DGE-Empfehlungen (2024)', publisher: 'Deutsche Gesellschaft für Ernährung', url: 'https://www.dge.de/gesunde-ernaehrung/gut-essen-und-trinken/dge-empfehlungen/' },
  issn2017: { title: 'ISSN Position Stand: protein and exercise (2017)', publisher: 'International Society of Sports Nutrition, J Int Soc Sports Nutr 14:20', url: 'https://doi.org/10.1186/s12970-017-0177-8' },
};

/** Grundsätze, die zur Einordnung oben im Katalog stehen. */
export const FOOD_PRINCIPLES = [
  { text: 'Überwiegend pflanzlich essen: Gemüse, Obst, Vollkorn, Hülsenfrüchte, Nüsse und pflanzliche Öle.', source: 'dge2024' },
  { text: 'Mindestens 5 Portionen Obst und Gemüse am Tag, gern saisonal.', source: 'dge2024' },
  { text: 'Mindestens einmal pro Woche Hülsenfrüchte und täglich eine kleine Handvoll Nüsse oder Samen.', source: 'dge2024' },
  { text: 'Bei Brot, Nudeln und Reis die Vollkornvariante wählen.', source: 'dge2024' },
  { text: 'Ein- bis zweimal pro Woche Fisch. Fleisch und Wurst höchstens 300 g pro Woche.', source: 'dge2024' },
  { text: 'Rund 1,5 Liter am Tag trinken, am besten Wasser oder ungesüßten Tee.', source: 'dge2024' },
  { text: 'Für Trainierende nennt die ISSN 1,4 bis 2,0 g Eiweiß pro kg Körpergewicht und Tag als Orientierung, verteilt auf mehrere Mahlzeiten. Bei Vorerkrankungen, etwa der Nieren, vorher ärztlich abklären.', source: 'issn2017', protein: true },
];

export const FOOD_GROUPS = {
  eiweiss: 'Eiweißquellen',
  huelsen: 'Hülsenfrüchte',
  gemuese: 'Gemüse',
  obst: 'Obst und Beeren',
  vollkorn: 'Vollkorn und Kohlenhydrate',
  fette: 'Nüsse, Samen und Öle',
  trinken: 'Trinken',
};

// goals: zu welchen Zielen die Zutat besonders passt (fitter, abnehmen, bewegung, ernaehrung, routinen)
// habit: passende Gewohnheits-Idee (Schlüssel aus FEATURES.habitIdeas)
export const FOODS_CATALOG = [
  // Eiweißquellen
  { key: 'skyr', name: 'Skyr oder Magerquark', group: 'eiweiss', goals: ['fitter', 'abnehmen'], why: 'Milchprodukt mit viel gut verfügbarem Eiweiß und Calcium bei wenig Fett.', tip: 'Mit Beeren und Haferflocken als Frühstück oder nach dem Training.', habit: 'protein-frueh', source: 'dge2024' },
  { key: 'huettenkaese', name: 'Hüttenkäse', group: 'eiweiss', goals: ['fitter', 'abnehmen'], why: 'Eiweißreicher Frischkäse, sättigt gut.', tip: 'Auf Vollkornbrot mit Tomate oder Gurke.', source: 'dge2024' },
  { key: 'joghurt', name: 'Naturjoghurt', group: 'eiweiss', goals: ['fitter', 'ernaehrung'], why: 'Liefert Eiweiß und Calcium, ohne zugesetzten Zucker die bessere Wahl.', tip: 'Statt Fruchtjoghurt: Naturjoghurt mit frischem Obst.', source: 'dge2024' },
  { key: 'eier', name: 'Eier', group: 'eiweiss', goals: ['fitter', 'abnehmen'], why: 'Eiweißreich und schnell zubereitet.', tip: 'Rührei mit Gemüse oder ein hart gekochtes Ei als Snack.', source: null },
  { key: 'haehnchen', name: 'Hähnchen- oder Putenbrust', group: 'eiweiss', goals: ['fitter', 'abnehmen'], why: 'Mageres Fleisch mit viel Eiweiß. Fleisch liefert gut verfügbares Eisen, Zink und Selen. Insgesamt höchstens 300 g Fleisch pro Woche.', tip: 'Für zwei Mittagessen vorkochen und mit Gemüse kombinieren.', source: 'dge2024' },
  { key: 'lachs', name: 'Lachs, Hering oder Makrele', group: 'eiweiss', goals: ['fitter', 'ernaehrung'], why: 'Fettreicher Seefisch liefert Eiweiß und Omega-3-Fettsäuren. Ein- bis zweimal pro Woche Fisch.', tip: 'Ofenlachs mit Ofengemüse, ein Blech, wenig Aufwand.', source: 'dge2024' },
  { key: 'tofu', name: 'Tofu oder Tempeh', group: 'eiweiss', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Pflanzliche Eiweißquelle aus Soja.', tip: 'Gewürfelt anbraten, in Bowls oder Pfannengerichten.', source: null },
  { key: 'edamame', name: 'Edamame', group: 'eiweiss', goals: ['fitter', 'abnehmen'], why: 'Junge Sojabohnen, eiweiß- und ballaststoffreich.', tip: 'Tiefgekühlt vorrätig halten, als Snack oder in Bowls.', source: null },
  // Hülsenfrüchte
  { key: 'linsen', name: 'Linsen', group: 'huelsen', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Hülsenfrüchte liefern viel Eiweiß und Ballaststoffe und sättigen gut. Mindestens einmal pro Woche.', tip: 'Rote Linsen garen in 10 bis 15 Minuten, ideal für Suppen und Currys.', habit: 'huelsen-woche', source: 'dge2024' },
  { key: 'kichererbsen', name: 'Kichererbsen', group: 'huelsen', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Eiweiß- und ballaststoffreich, vielseitig.', tip: 'Aus dem Glas abgespült in den Salat oder geröstet als Snack.', habit: 'huelsen-woche', source: 'dge2024' },
  { key: 'bohnen', name: 'Kidneybohnen, weiße oder schwarze Bohnen', group: 'huelsen', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Hülsenfrüchte mit viel Eiweiß, Ballaststoffen und Mineralstoffen.', tip: 'In Chili, Wraps oder Eintopf, auch aus der Dose.', habit: 'huelsen-woche', source: 'dge2024' },
  { key: 'erbsen', name: 'Erbsen', group: 'huelsen', goals: ['abnehmen', 'ernaehrung'], why: 'Hülsenfrucht, tiefgekühlt jederzeit verfügbar.', tip: 'Eine Handvoll in Nudeln, Reis oder Suppe.', source: 'dge2024' },
  { key: 'hummus', name: 'Hummus', group: 'huelsen', goals: ['ernaehrung', 'abnehmen'], why: 'Kichererbsen-Aufstrich, eine einfache Art, Hülsenfrüchte unterzubringen.', tip: 'Statt Butter oder Frischkäse aufs Brot, mit Gemüsesticks.', source: 'dge2024' },
  // Gemüse
  { key: 'brokkoli', name: 'Brokkoli', group: 'gemuese', goals: ['abnehmen', 'ernaehrung', 'fitter'], why: 'Gemüse liefert Vitamine, Mineralstoffe, Ballaststoffe und sekundäre Pflanzenstoffe und trägt zur Sättigung bei.', tip: 'Tiefgekühlt in 5 Minuten gedämpft.', habit: 'gemuese', source: 'dge2024' },
  { key: 'spinat', name: 'Spinat und Blattsalate', group: 'gemuese', goals: ['abnehmen', 'ernaehrung'], why: 'Viel Volumen, wenig Energie, liefert Vitamine und Mineralstoffe.', tip: 'Eine Handvoll Babyspinat ins Rührei oder in die Pasta.', habit: 'gemuese', source: 'dge2024' },
  { key: 'paprika', name: 'Paprika, Gurke, Karotten', group: 'gemuese', goals: ['abnehmen', 'ernaehrung', 'routinen'], why: 'Rohkost ohne Zubereitung, gut als Snack.', tip: 'Morgens Sticks schneiden und mitnehmen.', habit: 'snack-teller', source: 'dge2024' },
  { key: 'tomaten', name: 'Tomaten', group: 'gemuese', goals: ['abnehmen', 'ernaehrung'], why: 'Vielseitiges Gemüse, roh oder gekocht.', tip: 'Passierte Tomaten als Basis für schnelle Soßen.', source: 'dge2024' },
  { key: 'ofengemuese', name: 'Ofengemüse (Zucchini, Kürbis, Paprika, Zwiebeln)', group: 'gemuese', goals: ['abnehmen', 'ernaehrung', 'routinen'], why: 'Große Menge Gemüse mit wenig Aufwand.', tip: 'Ein Blech für zwei Tage, zu Fisch, Hähnchen oder Linsen.', source: 'dge2024' },
  { key: 'tk-gemuese', name: 'Tiefkühlgemüse', group: 'gemuese', goals: ['routinen', 'abnehmen'], why: 'Frisch oder tiefgekühlt gleichermaßen gut, immer vorrätig.', tip: 'Zwei Sorten im Gefrierfach als Notfallreserve.', source: 'dge2024' },
  // Obst und Beeren
  { key: 'himbeeren', name: 'Himbeeren', group: 'obst', goals: ['abnehmen', 'ernaehrung'], why: 'Obst liefert Vitamine, Ballaststoffe und sekundäre Pflanzenstoffe. Beeren sind vergleichsweise zuckerarm.', tip: 'Tiefgekühlt in Skyr oder Haferflocken, auch außerhalb der Saison.', habit: 'vielfalt', source: 'dge2024' },
  { key: 'heidelbeeren', name: 'Heidelbeeren', group: 'obst', goals: ['ernaehrung', 'fitter'], why: 'Obst zählt zu den 5 Portionen am Tag.', tip: 'Eine Handvoll zum Frühstück oder als Snack.', habit: 'vielfalt', source: 'dge2024' },
  { key: 'apfel', name: 'Äpfel und Birnen', group: 'obst', goals: ['abnehmen', 'routinen'], why: 'Gut transportierbar, sättigend durch Ballaststoffe.', tip: 'Mit Schale essen, ein Apfel in die Tasche.', source: 'dge2024' },
  { key: 'banane', name: 'Bananen', group: 'obst', goals: ['fitter', 'bewegung'], why: 'Leicht verdauliche Kohlenhydrate, praktisch vor dem Training.', tip: 'Vor einer Einheit am Abend als kleiner Snack.', source: 'dge2024' },
  { key: 'zitrus', name: 'Orangen und Mandarinen', group: 'obst', goals: ['ernaehrung'], why: 'Saisonales Obst im Winter.', tip: 'Ganz essen statt als Saft.', source: 'dge2024' },
  // Vollkorn und Kohlenhydrate
  { key: 'haferflocken', name: 'Haferflocken', group: 'vollkorn', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Vollkorn sättigt länger und enthält mehr Nährstoffe als Weißmehl.', tip: 'Overnight Oats am Vorabend, morgens fertig.', habit: 'protein-frueh', source: 'dge2024' },
  { key: 'vollkornbrot', name: 'Vollkornbrot', group: 'vollkorn', goals: ['abnehmen', 'ernaehrung'], why: 'Die Vollkornvariante sättigt länger.', tip: 'Beim Bäcker gezielt nach Vollkorn fragen, „dunkel“ ist nicht automatisch Vollkorn.', source: 'dge2024' },
  { key: 'vollkornnudeln', name: 'Vollkornnudeln und Naturreis', group: 'vollkorn', goals: ['fitter', 'abnehmen', 'ernaehrung'], why: 'Vollkorn statt Weißmehl, mehr Ballaststoffe.', tip: 'Schrittweise mischen, wenn der Geschmack ungewohnt ist.', source: 'dge2024' },
  { key: 'kartoffeln', name: 'Kartoffeln', group: 'vollkorn', goals: ['fitter', 'abnehmen'], why: 'Sättigende Beilage, gekocht oder aus dem Ofen statt frittiert.', tip: 'Pellkartoffeln mit Kräuterquark, schnell und eiweißreich.', source: null },
  { key: 'quinoa', name: 'Quinoa oder Buchweizen', group: 'vollkorn', goals: ['fitter', 'ernaehrung'], why: 'Abwechslung bei den Beilagen.', tip: 'Als Basis für Bowls.', source: null },
  // Nüsse, Samen, Öle
  { key: 'walnuesse', name: 'Walnüsse', group: 'fette', goals: ['ernaehrung', 'fitter'], why: 'Nüsse liefern ungesättigte Fettsäuren und Vitamin E. Täglich eine kleine Handvoll.', tip: 'Eine kleine Handvoll, nicht die ganze Tüte.', habit: 'nuesse', source: 'dge2024' },
  { key: 'mandeln', name: 'Mandeln', group: 'fette', goals: ['ernaehrung', 'fitter'], why: 'Kleine Handvoll pro Tag als Teil der DGE-Empfehlung.', tip: 'Ungesalzen und ungeröstet als Snack.', habit: 'nuesse', source: 'dge2024' },
  { key: 'leinsamen', name: 'Leinsamen, Chia oder Kürbiskerne', group: 'fette', goals: ['ernaehrung', 'abnehmen'], why: 'Samen zählen zur täglichen Handvoll Nüsse und Samen.', tip: 'Ein Esslöffel über Joghurt oder Salat.', habit: 'nuesse', source: 'dge2024' },
  { key: 'rapsoel', name: 'Rapsöl und Olivenöl', group: 'fette', goals: ['ernaehrung'], why: 'Pflanzliche Öle gehören zu den empfohlenen Fetten.', tip: 'Rapsöl zum Braten, Olivenöl für Salate.', source: 'dge2024' },
  // Trinken
  { key: 'wasser', name: 'Wasser und ungesüßter Tee', group: 'trinken', goals: ['abnehmen', 'routinen', 'fitter'], why: 'Rund 1,5 Liter am Tag, am besten energiefreie Getränke.', tip: 'Eine Flasche am Arbeitsplatz, zweimal am Tag auffüllen.', habit: 'flasche', source: 'dge2024' },
  { key: 'statt-softdrink', name: 'Sprudel mit Zitrone statt Limonade', group: 'trinken', goals: ['abnehmen'], why: 'Zuckerhaltige Getränke liefern Energie, ohne satt zu machen.', tip: 'Gekühlt vorrätig halten, damit die Alternative griffbereit ist.', habit: 'getraenke', source: 'dge2024' },
];

/** Ideen für Gewohnheiten, die der Katalog zusätzlich anbietet (ergänzen FEATURES.habitIdeas). */
export const FOOD_HABIT_IDEAS = [
  { key: 'huelsen-woche', name: 'Ein Gericht mit Hülsenfrüchten', when: 'pro Woche', perWeek: 1 },
  { key: 'nuesse', name: 'Kleine Handvoll Nüsse oder Samen', when: 'täglich' },
];
