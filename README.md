# ER Reference

A small, buildless veterinary reference website. Open `dist/` through a local web server; the website runs independently on any static web host. See `START-HERE.md` for GitHub upload and Cloudflare Pages settings.

## Run locally

Requirements: Python 3 and Node.js for development/checks. No npm installation or framework build is required.

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Stop the server with Ctrl+C. Patient weight/species are stored in this browser tab's session; use **New patient / clear all** for a new patient. **Clear preparation** retains shared patient and fluid-plan values.

## Run every check

```sh
node scripts/check-all.cjs
```

This checks JavaScript syntax, pure calculations, simulated form/event behavior, screen/print preparation agreement, numeric boundaries, local links, IDs, labels, ARIA references and script order. It exits immediately on a failed check. These checks do not replace an actual browser console, mobile layout, assistive-technology or print-preview review, or independent clinical validation.

## Project layout

- `dist/`: complete website; deployed directly, without a build step.
- `dist/calc.js`, `electrolyte-calc.js`, `blood-calc.js`, `drug-calc.js`, `cri-calc.js`: calculation logic. Prescribing guidance is kept in page content/data, not inferred by the arithmetic.
- `dist/patient-context.js`: shared weight/species synchronization and tab-session storage.
- `dist/number-format.js`: consistent finite-number display and exact-value storage for linked fields.
- `dist/preparation-check.js`: independent verification of what displayed stock, final volume and pump settings deliver; prescribed calculation targets are unchanged.
- `dist/cri.js`: insulin and Reglan interface only.
- `dist/cri-preparation.js`: lidocaine, ketamine and norepinephrine interfaces.
- `dist/fentanyl.js`: linked dose/concentration/rate/volume/time controls and optional normalized-mix shortcut.
- `dist/cri-print.js`: compact print references. Insulin/Reglan print and screen use the same preparation functions.
- `scripts/`: page-generation helpers and the complete check runner.
- `check*.cjs`: regression checks.
- `AUDIT.md`: findings, fixes, evidence and remaining verification limits from this review.

## Editing generated pages

CRI content/layout sources are in `scripts/build-cri-pages.py`, `scripts/cri-workflow-layout.py`, and the HTML fragments beside them. To regenerate CRI pages and shared navigation:

```sh
python3 scripts/build-cri-pages.py
node scripts/check-all.cjs
```

The generator finishes with `scripts/finalize-site.py`, which inserts the shared formatter and marks derived hidden fields as actual hidden inputs. Other legacy page generators are incremental tools; review their output and regenerate CRI navigation afterwards. Do not run them blindly over hand-edited content.

## Current workflows and clinical boundaries

- Fluids: shared dog/cat selection is required. Entered bolus is subtracted from estimated deficit; use zero if already accounted for. The GI-loss helper replaces the ongoing-loss input only when explicitly applied.
- Electrolytes: potassium, magnesium, phosphate, sodium and dextrose arithmetic preserve the owner-selected workbook methods and existing tool limits. Carrier potassium is intentionally excluded from the KCl calculation.
- Drugs: all 31 catalog rows stay visible under category headers. A dose/unit/stock edit updates its own row; patient changes update all rows. Stock concentrations are locked by default.
- Fentanyl: controls are linked; inputs plan a new preparation. The optional button creates 1 mcg/kg/hr = 1 mL/hr. An existing infusion's concentration must remain fixed when titrating its pump rate.
- Lidocaine: feline calculations and print references are disabled.
- Norepinephrine: default concentration-based mode, 0.05 mcg/kg/min, 15 mcg/mL and 12 mL final. Target-pump preparation is optional. Workbook peripheral/central guardrails remain 16/64 mcg/mL; these are not claimed to be universal veterinary maximums. The chart holds one preparation concentration fixed.
- Insulin: owner-selected fixed-rate DKA default is 0.1 U/kg/hr for dogs and cats, with explicit alternatives and the existing clinician-selected glucose/dextrose quick guide. No automatic BG titration or stop rule. Its print reference puts insulin rate/preparation formula above that same quick guide.
- Reglan: selectable syringe A, syringe B and fluid-bag print references; syringe run times remain editable. Dose units are mg/kg/day.
- Chocolate toxicity: dog-focused Merck methylxanthine calculator with oz/grams, generic type ranges, cocoa-% estimates, summed entries and labeled risk illustrations.
- Blood collection: calculated/blank cage-side forms and CSV export. Rolling totals remain manually recorded; a new sheet does not reset the clinical plan.

Dose/source review notes remain in `dist/sources.html` and on the relevant pages. This code review does not certify clinical recommendations or independently approve any medication protocol.

## Required checks after every update

Run `node scripts/check-all.cjs` after the final edit or generation step, including style-only changes. Fix every failure before publishing. Install the automatic pre-push check once in each Git checkout:

```sh
node scripts/install-check-hook.cjs
```

The hook runs the full suite before each push and blocks the push on failure. ZIP copies do not include Git configuration; initialize/clone a Git repository before installing the hook. Other publishing routes must explicitly run the suite; this is not a hosting-service enforcement rule.

The suite checks known expected answers, dose/pump-rate unit conversions, preparation mass/volume balance, threshold boundaries, invalid-input clearing, linked controls, feline restrictions, and matching screen/print preparations. Test assertions verify the implemented arithmetic and behavior; clinical recommendations still require independent review. Browser rendering and real print previews remain separate checks.

## Original Sheet page

`original-sheet.html` recreates the first workbook tab’s C3:V60 arrangement, column proportions, row spacing, merged labels and left/right section placement. `scripts/original-sheet-layout.json` retains the visual reference without cached formula results. Regenerate with `python3 scripts/build-original-sheet.py`, then run `node scripts/check-all.cjs`.

`original-sheet-calc.js` adapts the existing calculation functions; it does not evaluate arbitrary workbook formulas. The 12-hour fluid plan preserves daily maintenance and ongoing losses; impossible sodium mixtures are blocked. Shared weight/species apply throughout; the inactive species fluid block clears. KPhos K can be included in the KCl table explicitly. Norepinephrine uses mcg/kg/min, 1 mL/hr, a 12 mL capacity and the existing 16/64 mcg/mL access guardrails. Stock controls start locked. The on-page blood log is temporary and is cleared with the patient. Fit-to-width preserves the full layout, while disabling it permits normal-size horizontal scrolling.

## Compact electrolyte layouts

All five electrolyte pages use `scripts/compact-electrolytes.py` (called by the shared finalizer) to preserve their calculation IDs while placing charts beside live results on wide screens. The adapter is idempotent. Shared patient fields remain available to the calculation controllers but are hidden in the page body. Magnesium bloodwork guidance stays beside dose options, lab-range overrides are expandable, and phosphate’s K contribution stays prominent inside its result panel. Sodium checklists and preparation detail expand on demand; urgent cautions remain visible.

`electrolyte-layout.js` prevents forced scrolling/math expansion on desktop, and brings offscreen results into view on narrow screens. Dose and mixture functions are unchanged. Full tests include this presentation behavior and its reduced-motion handling.

## Latest exported behavior

Website source commit: `46083220a292d6440d9caf1810f1bf5249cc5592` (hosted version 74). Export instructions and the GitHub test workflow are additional packaging files; website files are unchanged.

- Shared fluid-rate banner includes the calculated maintenance/deficit/loss breakdown and planned volume/duration.
- KCl and phosphate follow the shared rate. Local edits create overrides; **Use shared rate** reconnects them. Display rounding does not alter calculations.
- Magnesium retains its separate pump rate linked to volume and duration.
- KCl concentration is highlighted at or above the clinician-selected peripheral limit of 0.2 mEq/mL, separate from the dose-rate limits. References in the context disclosure are not attributed as support for this selected value.
- Patient and fluid data remain in the browser tab session. Clear patient clears the shared rate and overrides.
- Cloudflare Workers builds run the suite through `wrangler.json` before deployment. No GitHub Actions workflow is currently committed.

## Clinical workflow review and browser checks

See `CLINICAL-REVIEW.md` for preparation precision, reset scope, rate-source labels, explicit concurrent supplemental-potassium reconciliation, preserved insulin chart decisions and remaining source-review requirements. Drug reference-range warnings are advisory; no new species-specific local-anesthetic maximum is enabled.

Optional real-browser regressions require Playwright and Chromium in the development environment. With the local server running, use `node scripts/check-clinical-browser.cjs`. `CHROMIUM_PATH` overrides the default `/usr/bin/chromium`; `ER_REFERENCE_TEST_URL` overrides the local test server address. The test uses synthetic patient inputs and writes an insulin review PDF under `/tmp`. These development tools are not website runtime dependencies.

## Maintenance audit checks

`MAINTENANCE-AUDIT.md` ranks confirmed findings and explains the fixes and remaining validation limits. Prescribed targets and existing clinical limits are unchanged. Preparation results distinguish nominal calculations from verification of displayed stock and pump quantities; a Caution requires preparation review. Dilute to the stated final volume rather than treating a rounded carrier estimate as an exact instruction.

Run `python3 scripts/check-generators.py` to regenerate CRI pages twice and run the complete suite in a temporary copy, preserving hand-edited working files. With the local server running, `node scripts/check-maintenance-browser.cjs` exercises every calculator, invalid states, reset behavior, wheel/keyboard access, mobile layouts and PDF text. It requires the same optional Playwright/Chromium tools plus `pdftotext`. PDFs and screenshots use synthetic patient inputs and are written under `/tmp`.

## Simple sodium reference

Keep the primary sodium page close to the original workbook: preparation quantities, correction time emphasized under Free water deficit, secondary D5W quantities, and visible substituted math. Bag duration follows the shared rate with a local override; its 0.5 mEq/L/hr sodium target is hypothetical, not a fluid-response prediction. The bolus card scales saline, Plasma-Lyte/Normosol-R and LRS add-on recipes to the remaining base volume. The compact bag summary stays near the inputs, with the selected preparation beside the fluid choices and one shared math reference below. Sodium-only sidebar jumps reveal the relevant sections. Monitoring guidance and the independent tab-session tracker belong in optional disclosures at the bottom; they must not drive, block or overwrite the reference calculations or shared fluid plan.

`python3 scripts/simple-sodium.py` updates the presentation; the shared finalizer also calls it after generation. `sodiumWaterReference` applies the clinician-selected 10, 11 or 12 mEq/L per 24-hour chronic ceiling (default 12) to the dedicated page while retaining the legacy pure `freeWater` function for the Original Sheet. Editable proposed target 158 is not a laboratory reference interval. Run the full suite after editing. Optional browser checks: `ER_REFERENCE_TEST_URL=http://127.0.0.1:8000 node scripts/check-simple-sodium-browser.cjs` (existing Playwright/Chromium/pdftotext development tools).

## Clinical visual style

The chocolate illustrations share one decorative SVG family in `scripts/clinical-icons.py`: a 24-unit grid, 1.5-unit rounded navy strokes and 32px display size. Keep visible text labels beside icons. `python3 scripts/apply-clinical-icons.py` updates existing chocolate markup without replacing clinical content; the chocolate builder and shared finalizer use the same source. `scripts/check-generators.py` now also exercises chocolate regeneration in its temporary copy.

With a local server running, `ER_REFERENCE_TEST_URL=http://127.0.0.1:8000 node scripts/check-visual-browser.cjs` checks icon consistency, selected-result icons, proportional bands, representative desktop/mobile pages, keyboard chart scrolling and console errors, and creates a print PDF. These checks do not establish complete accessibility or clinical validation. See `docs/visual-review/chocolate-icons.png` for the updated icon family. Run the complete suite after edits.

The original stronger navigation accents are retained, with pale category-colored page/sidebar backgrounds for orientation (blue fluids, teal electrolytes, purple CRIs, rose blood collection and amber chocolate). Clinical warning colors remain separate. The stomach icon retains the shared outline family with a more anatomical shape. Chocolate’s charcoal card appears only for cardiac, neurologic and severe/LD₅₀ estimates; it retains Merck’s lethal-exposure caution and clears for invalid/incomplete or non-canine estimates. The emesis window up to 4 hours is explicitly clinician-selected, not attributed to Merck’s recent-exposure example. Its source distinction is visible in the page’s Sources & assumptions.

## Chocolate source verification

`CHOCOLATE-SOURCE-REVIEW.md` records the evidence comparison and access limits. Keep the source detail in `scripts/chocolate-sources.html`; `scripts/chocolate-source-record.py` applies it and the central source summary to existing pages, and the shared finalizer runs it after generation. The expandable concentration table is rendered directly from `ChocolateCalc.products`, with mg/oz equivalents calculated from its unrounded mg/g values. Clinical references and clinician-selected guidance must remain distinguishable; an observational study does not validate thresholds or a treatment protocol. Run the complete suite after edits.

## Phosphate: additional potassium from KCl

The top KCl box defaults to the current patient's verified KCl contribution (excluding K already credited from other infusions). Concurrent use must be confirmed before it enters the selected KPhos total. Manual overrides and confirmation persist in this tab; **Use KCl calculator** reconnects, and **New patient** clears them. Invalid/stale linked rates clear dependent preparation results while confirmed. The older full source reconciliation remains optional below. The combined phosphate/K limit remains 0.5 mEq/kg/hr.

`scripts/phosphate-kcl-layout.py` maintains the layout after generation; `dist/phosphate-kcl.js` owns the link/override state. Run `ER_REFERENCE_TEST_URL=http://127.0.0.1:8000 node scripts/check-phosphate-kcl-browser.cjs` for the optional real-browser regression covering navigation, exact totals, no double counting, local override/relink, confirmation, changed/invalid source, patient reset and the 0.2 mEq/mL peripheral boundary.
