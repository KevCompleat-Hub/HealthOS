"""BLS 4.0 für EvoVive aufbereiten. Quelle: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0. Karlsruhe.
Liest die Hauptdatei und schreibt zwei kompakte JSON-Dateien je 100 g essbaren Anteil:
  bls-core.json  Name, Energie, Eiweiß, Kohlenhydrate, Fett, Ballaststoffe, Zucker, Salz, gesättigte Fettsäuren
  bls-micro.json Calcium, Eisen, Magnesium, Kalium, Vitamin C, Vitamin D, Vitamin B12, Folat-Äquivalent (nur zum Nachschlagen)
Werte: Zahl, null = fehlender Wert (laut Dokumentation nicht Null), "tr" = Spuren oder unter Nachweis-/Bestimmungsgrenze.
Aufruf: python3 tools/bls/extract.py /pfad/BLS_4_0_Daten_2025_DE.xlsx"""
import json, sys, os, openpyxl
CORE = [('kcal', 'ENERCC', 0), ('p', 'PROT625', 1), ('c', 'CHO', 1), ('f', 'FAT', 1), ('fib', 'FIBT', 1), ('sugar', 'SUGAR', 1), ('salt', 'NACL', 2), ('satfat', 'FASAT', 1)]
MICRO = [('ca', 'CA', 0), ('fe', 'FE', 1), ('mg', 'MG', 0), ('k', 'K', 0), ('vitc', 'VITC', 1), ('vitd', 'VITD', 2), ('b12', 'VITB12', 2), ('fol', 'FOL', 0)]
src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/BLS_4_0_Daten_2025_DE.xlsx'
out = os.path.join(os.path.dirname(__file__), '..', '..', 'apps', 'web', 'public', 'bls')
ws = openpyxl.load_workbook(src, read_only=True, data_only=True).worksheets[0]
rows = ws.iter_rows(values_only=True); hdr = next(rows)
col = {}
for i, h in enumerate(hdr):
    if h is None: continue
    s = str(h); code = s.split(' ')[0]
    if 'Datenherkunft' in s or 'Referenz' in s: continue
    col.setdefault(code, i)
def val(v, nd):
    if isinstance(v, (int, float)): return round(float(v), nd) if nd else int(round(v))
    if v is None: return None
    t = str(v).strip()
    if t == '-' or t == '': return None
    if t.upper().startswith('TR') or t.startswith('<'): return 'tr'
    try: return round(float(t.replace(',', '.')), nd)
    except ValueError: return None
core, micro, stats = [], {}, {'null': 0, 'tr': 0}
for r in rows:
    if not r or not r[0]: continue
    c = [r[0], str(r[1]).strip()] + [val(r[col[k]], nd) for _, k, nd in CORE]
    for x in c[2:]:
        if x is None: stats['null'] += 1
        elif x == 'tr': stats['tr'] += 1
    core.append(c)
    micro[r[0]] = [val(r[col[k]], nd) for _, k, nd in MICRO]
meta = {'source': 'Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0. Karlsruhe.', 'basis': 'je 100 g essbarer Anteil', 'missing': 'null = kein Wert (nicht Null)', 'trace': 'tr = Spuren oder unter Nachweisgrenze'}
json.dump({**meta, 'fields': ['code', 'name'] + [k for k, _, _ in CORE], 'rows': core}, open(os.path.join(out, 'bls-core.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({**meta, 'fields': [k for k, _, _ in MICRO], 'rows': micro}, open(os.path.join(out, 'bls-micro.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(core)} Lebensmittel, fehlende Werte {stats["null"]}, Spuren {stats["tr"]}')
