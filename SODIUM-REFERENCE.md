# Simple sodium reference

This replaces the closed PR's treatment-management workflow with a workbook-style calculation aid, built from current main. No mandatory samples, perfusion assessments, prescription recording, confirmation gates or shared-rate transfers were added.

- High sodium: patient target, editable correction hours, D5W deficit and mL/hr. Existing acute reference remains; chronic default hours respect both 0.5 mEq/L/hr and the clinician-selected daily ceiling of 10, 11 or 12 mEq/L per 24 hours (default 10). Custom hours retain the existing hourly safeguard and a daily-limit warning.
- Low sodium: select desired final fluid volume and fluid sodium, then see the crystalloid removal and D5W replacement for LRS, Plasma-Lyte and saline. Selecting the pathway sets its stock preset and clears the previous target/selection so an old result cannot appear current.
- Substituted equations are always visible for every active tool, including actual displayed-mixture verification after stock-volume rounding. Internal calculations retain precision. Patient target and fluid concentration remain distinct.
- Optional guidance/response estimate and optional sample notes stay closed at the bottom. Sample notes never alter calculations or the shared rate. They persist within the browser tab and clear with New patient; they are not a medical record or a complete rolling-24-hour safety assessment.

The original uploaded workbook is the layout/calculation reference, not a source of new protocols. Its 2.79 kg / Na 168 → 155 example yields 140.4 mL free water. Its entered 28 hours gives 5.0142857 mL/hr; the current approved daily ceiling instead suggests 31.2 hours and 4.5 mL/hr. Entering 28 hours remains possible, with the daily warning. The 1,000 mL LRS / fluid Na 117 example removes 100 mL and replaces it with 100 mL D5W. The editable proposed patient target 158 remains owner-selected, not a validated laboratory upper limit. Glucose-correction assumptions and Original Sheet arithmetic are unchanged.

Sources: [AAHA 2024, Section 5, Tables 12C/13A](https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-5-fluid-therapy-in-ill-patients/) and the existing on-page sources. Monitoring and treatment changes remain the clinician's responsibility.

Validation: full baseline/final suites; independent workbook examples and invalid/zero/custom-duration regressions; Chromium checks of both pathways, live weight changes, all visible math, independent tracker/reset/navigation behavior, keyboard/wheel protection, phone layouts and both printed PDFs. Existing browser audits passed across all 17 pages/every calculator. Repeated CRI generation/full checks passed twice. Browser checks found no JavaScript page errors. Safari/Firefox, physical printing, assistive technology and bedside clinical validation were not performed. Software checks are not complete clinical validation.

Screenshots: [High sodium](docs/simple-sodium/high.png) · [Low sodium](docs/simple-sodium/low.png).
