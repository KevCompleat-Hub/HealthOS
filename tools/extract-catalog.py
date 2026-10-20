#!/usr/bin/env python3
"""Erzeugt packages/domain/src/catalog.ts unverändert aus der eingefrorenen Referenz v5.
Die Werte werden nicht abgetippt, sondern aus dem Quelltext übernommen. Der Paritätstest „Kataloge“ prüft das Ergebnis."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'packages/reference/v5/app.jsx').read_text()

def stmt(name):
    key = f"const {name} = "; i = src.index(key); j = i + len(key); depth = 0; k = j; instr = None
    while True:
        ch = src[k]
        if instr:
            if ch == '\\': k += 2; continue
            if ch == instr: instr = None
        elif ch in "'\"`": instr = ch
        elif ch in '([{': depth += 1
        elif ch in ')]}': depth -= 1
        elif ch == ';' and depth == 0: break
        k += 1
    return src[j:k]

TYPES = {
 'TYPES': 'Record<string, { label: string; icon: string }>', 'GOALS': 'Record<GoalKey, string>',
 'PLACES': 'Record<string, { label: string; title: string; kind: string }>', 'HABIT_LIBRARY': 'Record<string, { name: string; goals: GoalKey[] }>',
 'SLOTS': 'Record<string, string>', 'INTENSITIES': 'Record<string, [string, string]>', 'TONES': 'Record<string, [string, string]>',
 'PAUSE_KINDS': 'Record<string, string>', 'TASK_CLASSES': 'Record<string, [string, string]>', 'PRIORITIES': 'Record<string, string>',
 'STATUS_INFO': 'Record<string, [string, string, string]>', 'FOODS': 'Food[]', 'IDEA_FOODS': 'string[]', 'MEALS': 'string[]', 'MAIN_MEALS': 'string[]',
 'WORKOUT_KINDS': 'string[]', 'INTENSITY': 'string[]', 'APPT_STATUS': 'Record<string, string>', 'REVIEW_STATUS': 'Record<string, string>',
 'COVERAGE_LABEL': 'Record<Coverage, string>', 'ITEM_STATUSES': 'ItemStatus[]',
 'EVIDENCE': 'Record<string, { title: string; publisher: string; date: string; url: string; note: string }>',
 'EVIDENCE_LEVELS': 'Record<string, [string, string]>', 'REC_STATUS': 'Record<string, string>',
}
out = ["/**\n * Kataloge und Stammdaten. Werte automatisiert und unverändert aus der Referenz v5 übernommen\n * (siehe tools/extract-catalog.py) und per Paritätstest gegen die Referenz geprüft.\n */",
       "import type { Config, Coverage, Food, GoalKey, ItemStatus } from './types.js';", "", "export const SCHEMA = 2;"]
for n, t in TYPES.items(): out.append(f"export const {n}: {t} = {stmt(n)};")
out.append(f"export const DEFAULT_CONFIG: Config = {stmt('DEFAULT_CONFIG')};")
(ROOT / 'packages/domain/src/catalog.ts').write_text("\n".join(out) + "\n")
print('catalog.ts erzeugt')
