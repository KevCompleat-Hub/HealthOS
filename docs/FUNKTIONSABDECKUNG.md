# Funktionsabdeckung Referenz v5 → TypeScript-Kern

Automatisch erzeugt von tools/coverage-map.mjs. 257 Top-Level-Namen der Referenz.

- portiert: 167
- intern: 2
- bewusst nicht portiert: 11
- Oberfläche (M3): 77
- OFFEN: 0

| Name in der Referenz | Zuordnung | Modul oder Begründung |
| --- | --- | --- |
| `pad` | portiert | util/date.ts |
| `iso` | portiert | util/date.ts |
| `parse` | portiert | util/date.ts |
| `addDays` | portiert | util/date.ts |
| `wdIdx` | portiert | util/date.ts |
| `weekStart` | portiert | util/date.ts |
| `weekDays` | portiert | util/date.ts |
| `WD` | portiert | util/date.ts |
| `daysBetween` | portiert | util/date.ts |
| `fmtLong` | portiert | util/date.ts |
| `fmtShort` | portiert | util/date.ts |
| `fmtDM` | portiert | util/date.ts |
| `fmtNum` | portiert | util/date.ts |
| `fmtVal` | portiert | util/date.ts |
| `parseNum` | portiert | util/date.ts |
| `toMin` | portiert | util/date.ts |
| `byTime` | portiert | util/date.ts |
| `isoWeek` | portiert | util/date.ts |
| `dayLabel` | portiert | util/date.ts |
| `dayLabelLc` | portiert | util/date.ts |
| `avg` | portiert | util/date.ts |
| `signed` | portiert | util/date.ts |
| `_id` | intern | interner Zähler, jetzt in util/ids.ts (configureIds) |
| `uid` | portiert | util/ids.ts |
| `rng` | portiert | util/ids.ts |
| `_fmtBerlin` | intern | interner Cache, jetzt modulintern in util/date.ts |
| `berlinParts` | portiert | util/date.ts |
| `TYPES` | portiert | catalog.ts |
| `SCHEMA` | portiert | catalog.ts |
| `GOALS` | portiert | catalog.ts |
| `PLACES` | portiert | catalog.ts |
| `HABIT_LIBRARY` | portiert | catalog.ts |
| `SLOTS` | portiert | catalog.ts |
| `INTENSITIES` | portiert | catalog.ts |
| `TONES` | portiert | catalog.ts |
| `PAUSE_KINDS` | portiert | catalog.ts |
| `TASK_CLASSES` | portiert | catalog.ts |
| `PRIORITIES` | portiert | catalog.ts |
| `STATUS_INFO` | portiert | catalog.ts |
| `DEFAULT_CONFIG` | portiert | catalog.ts |
| `clone` | portiert | util/ids.ts |
| `normalizeConfig` | portiert | config.ts |
| `hm` | portiert | util/date.ts |
| `r15` | portiert | util/date.ts |
| `wdist` | portiert | util/date.ts |
| `spreadPick` | portiert | plan/build.ts |
| `inQuiet` | portiert | plan/build.ts |
| `fitQuiet` | portiert | plan/build.ts |
| `planMeta` | portiert | plan/build.ts |
| `classOfItem` | portiert | plan/build.ts |
| `buildPlan` | portiert | plan/build.ts |
| `suggestHabits` | portiert | plan/build.ts |
| `syncHabits` | portiert | plan/build.ts |
| `versionAt` | portiert | plan/routines.ts |
| `weeksBetween` | portiert | plan/routines.ts |
| `specAt` | portiert | plan/routines.ts |
| `specText` | portiert | plan/routines.ts |
| `routineFromPlan` | portiert | plan/routines.ts |
| `sameSpec` | portiert | plan/routines.ts |
| `addVersion` | portiert | plan/routines.ts |
| `syncPlanRoutines` | portiert | plan/routines.ts |
| `instanceOf` | portiert | plan/routines.ts |
| `isPlanFree` | portiert | plan/materialize.ts |
| `allPauses` | portiert | plan/materialize.ts |
| `applyPauses` | portiert | plan/materialize.ts |
| `settle` | portiert | plan/materialize.ts |
| `materialize` | portiert | plan/materialize.ts |
| `planDiff` | portiert | plan/materialize.ts |
| `findConflicts` | portiert | plan/materialize.ts |
| `pausedAll` | portiert | plan/materialize.ts |
| `validateWeight` | portiert | config.ts |
| `workError` | portiert | config.ts |
| `migratePause` | portiert | plan/materialize.ts |
| `buildExport` | portiert | io.ts |
| `ITEM_STATUSES` | portiert | catalog.ts |
| `parseImport` | portiert | io.ts |
| `Store` | bewusst nicht portiert | Speicher-Adapter der Claude-Laufzeit (claude.use("db")). Wird in M2 durch Repositories auf Supabase ersetzt. |
| `migrateSaved` | portiert | io.ts |
| `snapshotDocs` | portiert | io.ts |
| `FOODS` | portiert | catalog.ts |
| `IDEA_FOODS` | portiert | catalog.ts |
| `MEALS` | portiert | catalog.ts |
| `MAIN_MEALS` | portiert | catalog.ts |
| `snap` | portiert | status.ts |
| `WORKOUT_KINDS` | portiert | catalog.ts |
| `INTENSITY` | portiert | catalog.ts |
| `APPT_STATUS` | portiert | catalog.ts |
| `seed` | portiert | demo/seed.ts |
| `effStatus` | portiert | status.ts |
| `inWeek` | portiert | status.ts |
| `trainingsInWeek` | portiert | status.ts |
| `pauseStats` | portiert | status.ts |
| `habitStats` | portiert | status.ts |
| `missesInWeek` | portiert | status.ts |
| `weightTrend` | portiert | status.ts |
| `dayNutrition` | portiert | status.ts |
| `nextActions` | portiert | status.ts |
| `coachHint` | portiert | status.ts |
| `hints` | portiert | status.ts |
| `EVIDENCE` | portiert | catalog.ts |
| `EVIDENCE_LEVELS` | portiert | catalog.ts |
| `REC_STATUS` | portiert | catalog.ts |
| `LAB_MARKERS` | portiert | intelligence.ts |
| `normUnit` | portiert | intelligence.ts |
| `markerOf` | portiert | intelligence.ts |
| `labAssessment` | portiert | intelligence.ts |
| `TAKE_ROUTINES` | portiert | intelligence.ts |
| `REC_DEFS` | portiert | intelligence.ts |
| `LAB_REC_IDS` | portiert | intelligence.ts |
| `persistableRecState` | portiert | intelligence.ts |
| `computeRecs` | portiert | intelligence.ts |
| `recView` | portiert | intelligence.ts |
| `recSourceList` | portiert | intelligence.ts |
| `A` | portiert | actions.ts |
| `WD_LONG` | portiert | util/date.ts |
| `ICONS` | bewusst nicht portiert | Symbole (UI) |
| `Icon` | Oberfläche (M3) | React-Komponente oder Hook |
| `Segmented` | Oberfläche (M3) | React-Komponente oder Hook |
| `Field` | Oberfläche (M3) | React-Komponente oder Hook |
| `Sheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `Progress` | Oberfläche (M3) | React-Komponente oder Hook |
| `StatusTag` | Oberfläche (M3) | React-Komponente oder Hook |
| `ItemRow` | Oberfläche (M3) | React-Komponente oder Hook |
| `Empty` | Oberfläche (M3) | React-Komponente oder Hook |
| `LineChart` | Oberfläche (M3) | React-Komponente oder Hook |
| `BarChart` | Oberfläche (M3) | React-Komponente oder Hook |
| `DayArc` | Oberfläche (M3) | React-Komponente oder Hook |
| `Stat` | Oberfläche (M3) | React-Komponente oder Hook |
| `CoachLine` | Oberfläche (M3) | React-Komponente oder Hook |
| `Today` | Oberfläche (M3) | React-Komponente oder Hook |
| `HabitGrid` | Oberfläche (M3) | React-Komponente oder Hook |
| `StatusLegend` | Oberfläche (M3) | React-Komponente oder Hook |
| `Week` | Oberfläche (M3) | React-Komponente oder Hook |
| `Recent` | Oberfläche (M3) | React-Komponente oder Hook |
| `WeightForm` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepsForm` | Oberfläche (M3) | React-Komponente oder Hook |
| `TrainingForm` | Oberfläche (M3) | React-Komponente oder Hook |
| `MealForm` | Oberfläche (M3) | React-Komponente oder Hook |
| `Capture` | Oberfläche (M3) | React-Komponente oder Hook |
| `AcceptedMeasures` | Oberfläche (M3) | React-Komponente oder Hook |
| `Development` | Oberfläche (M3) | React-Komponente oder Hook |
| `groupLabs` | portiert | intelligence.ts |
| `refText` | portiert | intelligence.ts |
| `refPos` | portiert | intelligence.ts |
| `yy` | portiert | util/date.ts |
| `EvidenceBadge` | Oberfläche (M3) | React-Komponente oder Hook |
| `RecCard` | Oberfläche (M3) | React-Komponente oder Hook |
| `RecSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `RecsList` | Oberfläche (M3) | React-Komponente oder Hook |
| `LabInfluence` | Oberfläche (M3) | React-Komponente oder Hook |
| `LabCard` | Oberfläche (M3) | React-Komponente oder Hook |
| `Labs` | Oberfläche (M3) | React-Komponente oder Hook |
| `Appointments` | Oberfläche (M3) | React-Komponente oder Hook |
| `Health` | Oberfläche (M3) | React-Komponente oder Hook |
| `ChangePreview` | Oberfläche (M3) | React-Komponente oder Hook |
| `ItemSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `EditInstanceSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `AddItemSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `PauseSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `InfoSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `LabSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `ApptSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `SOURCE_LABEL` | bewusst nicht portiert | Anzeigetexte für Quellen (UI) |
| `RoutinesScreen` | Oberfläche (M3) | React-Komponente oder Hook |
| `RoutineSheet` | Oberfläche (M3) | React-Komponente oder Hook |
| `MONTHS` | portiert | util/date.ts |
| `ymOf` | portiert | util/date.ts |
| `monthLast` | portiert | util/date.ts |
| `prevYm` | portiert | util/date.ts |
| `fmtYm` | portiert | util/date.ts |
| `REVIEW_STATUS` | portiert | catalog.ts |
| `pct` | portiert | util/date.ts |
| `COVERAGE_LABEL` | portiert | catalog.ts |
| `planStart` | portiert | review/coverage.ts |
| `habitStart` | portiert | review/coverage.ts |
| `weekCoverage` | portiert | review/coverage.ts |
| `goalAt` | portiert | review/coverage.ts |
| `trainingSeries` | portiert | review/coverage.ts |
| `avgComplete` | portiert | review/coverage.ts |
| `gapText` | portiert | review/coverage.ts |
| `weeklyWindow` | portiert | review/schedule.ts |
| `monthlyTarget` | portiert | review/schedule.ts |
| `weeklyDescriptor` | portiert | review/schedule.ts |
| `monthlyDescriptor` | portiert | review/schedule.ts |
| `combinedDescriptor` | portiert | review/schedule.ts |
| `reviewOpen` | portiert | review/schedule.ts |
| `reviewDue` | portiert | review/schedule.ts |
| `reviewOffer` | portiert | review/schedule.ts |
| `reviewForDate` | portiert | review/schedule.ts |
| `nextWeeklyDate` | portiert | review/schedule.ts |
| `slotItem` | portiert | review/schedule.ts |
| `completeReviewState` | portiert | review/schedule.ts |
| `adherence` | portiert | review/metrics.ts |
| `isPause` | portiert | review/metrics.ts |
| `isTrainingPlan` | portiert | review/metrics.ts |
| `habitOn` | portiert | status.ts |
| `habitAdherence` | portiert | review/metrics.ts |
| `windowCoverage` | portiert | review/metrics.ts |
| `avgIn` | portiert | review/metrics.ts |
| `weightChange` | portiert | review/metrics.ts |
| `trainingHistory` | portiert | review/metrics.ts |
| `weekMetrics` | portiert | review/metrics.ts |
| `monthMetrics` | portiert | review/metrics.ts |
| `QUESTIONS` | portiert | review/questions.ts |
| `pickQuestions` | portiert | review/questions.ts |
| `previousQuestionIds` | portiert | review/questions.ts |
| `nextMonday` | portiert | review/coach.ts |
| `versionRoutines` | portiert | review/coach.ts |
| `priorDecisions` | portiert | review/coach.ts |
| `AREA_GOALS` | portiert | review/coach.ts |
| `coachMeasures` | portiert | review/coach.ts |
| `applyMeasureState` | portiert | review/coach.ts |
| `measureRecord` | portiert | review/coach.ts |
| `evalMeasure` | portiert | review/coach.ts |
| `runningMeasures` | portiert | review/coach.ts |
| `persistableReviews` | portiert | review/coach.ts |
| `MiniStat` | Oberfläche (M3) | React-Komponente oder Hook |
| `MeasureEvidence` | Oberfläche (M3) | React-Komponente oder Hook |
| `MeasureCard` | Oberfläche (M3) | React-Komponente oder Hook |
| `Question` | Oberfläche (M3) | React-Komponente oder Hook |
| `RunningMeasures` | Oberfläche (M3) | React-Komponente oder Hook |
| `CoverageNote` | Oberfläche (M3) | React-Komponente oder Hook |
| `WeekSummary` | Oberfläche (M3) | React-Komponente oder Hook |
| `PosNeg` | Oberfläche (M3) | React-Komponente oder Hook |
| `MonthSummary` | Oberfläche (M3) | React-Komponente oder Hook |
| `MonthGoals` | Oberfläche (M3) | React-Komponente oder Hook |
| `MonthHealth` | Oberfläche (M3) | React-Komponente oder Hook |
| `ShortSummary` | Oberfläche (M3) | React-Komponente oder Hook |
| `STEPS` | bewusst nicht portiert | Schrittfolge des Review-Ablaufs in der Oberfläche (UI, M3) |
| `ReviewFlow` | Oberfläche (M3) | React-Komponente oder Hook |
| `ReviewCard` | Oberfläche (M3) | React-Komponente oder Hook |
| `ReviewHistory` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepReviews` | Oberfläche (M3) | React-Komponente oder Hook |
| `Chips` | Oberfläche (M3) | React-Komponente oder Hook |
| `DayToggles` | Oberfläche (M3) | React-Komponente oder Hook |
| `Stepper` | Oberfläche (M3) | React-Komponente oder Hook |
| `Toggle` | Oberfläche (M3) | React-Komponente oder Hook |
| `setSec` | bewusst nicht portiert | Setter für Einstellungsformulare (UI) |
| `StepWeight` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepGoals` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepWork` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepBreaks` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepTraining` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepNutrition` | Oberfläche (M3) | React-Komponente oder Hook |
| `StepReminders` | Oberfläche (M3) | React-Komponente oder Hook |
| `PlanPreview` | Oberfläche (M3) | React-Komponente oder Hook |
| `OB_STEPS` | bewusst nicht portiert | Ablauf der Einrichtungs-Oberfläche (UI, M3) |
| `StepContent` | Oberfläche (M3) | React-Komponente oder Hook |
| `Onboarding` | Oberfläche (M3) | React-Komponente oder Hook |
| `SET_SECTIONS` | bewusst nicht portiert | Einstellungs-Oberfläche (UI) |
| `sectionSummary` | bewusst nicht portiert | Kurztext je Einstellungsbereich für die Oberfläche (UI, M3). Reine Anzeige, keine Geschäftsregel. |
| `StorageInfo` | Oberfläche (M3) | React-Komponente oder Hook |
| `Settings` | Oberfläche (M3) | React-Komponente oder Hook |
| `TABS` | bewusst nicht portiert | Navigation (UI) |
| `EMPTY_BODY` | bewusst nicht portiert | Formular-Vorbelegung (UI) |
| `TAB_OF` | bewusst nicht portiert | Navigation (UI) |
| `App` | Oberfläche (M3) | React-Komponente oder Hook |
