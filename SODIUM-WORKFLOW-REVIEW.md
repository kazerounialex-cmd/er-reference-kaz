# Sodium workflow review · November 3, 2026

## Implemented

A separate `sodium-clinical-workflow` branch starts from `cb8f34b` (current main at review start), preserving the merged ongoing-loss import fix and previous audit changes.

- Two prominent high/low selections show only the chosen pathway. The low-sodium measured value, workup, stock presets, mixing safeguards, glucose correction and sodium-plus-potassium response calculation retain their existing behavior. Shared mixing cards move into an explicit advanced disclosure in the high-sodium pathway.
- High sodium separates perfusion assessment from dehydration and free-water replacement. It does not prescribe a bolus or require complete dehydration replacement before controlled sodium management. Initial sodium and its actual local sample time are retained. Repeat entry is near the top; detailed history is below the plan.
- Latest sodium drives the next-interval estimate. Default chronic/unknown context, 4-hour reassessment, 4/6-hour shortcuts and a selectable slower decline up to the existing 0.5 mEq/L/hr reference are explicit. Overall estimated correction duration is distinct from reassessment time and respects both hourly and daily constraints. Custom hours keep warnings active. With a reduced measured-history allowance, the duration estimate conservatively holds that allowance across the next 24 hours rather than treating the daily budget as newly available. Reassessment can change the estimate; zero allowance labels the time as a reference lower bound only and blocks prescribing.
- Free-water estimates to eventual and next targets remain separate from the clinician-selected fluid volume and mL/hr. No deficit or prescription is added automatically to the shared fluid plan. Recording a prescription does not transfer its rate; a separate explicit action transfers only its current IV rate. Enteral prescriptions never transfer to the shared IV rate.
- Prescriptions become stale after a new measurement, relevant input/weight/species change, incomplete sample entry or their scheduled recheck time. Invalid repeat entry remains invalid on reload. Overdue samples cannot produce a newly recorded/transferred interval prescription. Original measurements and prescription history remain after clearing preparation. New patient clears them, including after navigation/back restoration.
- Sodium history shows measured direction, actual elapsed hours, hourly change, total change since initial, and boundary-bracketed/partial rolling history. No synthetic 24-hour boundary value is invented. Warning text accompanies caution symbols. Numeric inputs retain the site's wheel protection.
- A dedicated print summary shows the current prescription or explicitly identifies its absence/staleness, free-water cautions and recorded history. It omits the inactive pathway. Representative populated high-sodium output is two Letter pages.

No frameworks or runtime dependencies were added. Pure history/target arithmetic is separated from DOM/session logic. The source fragment, idempotent generation adapter and deployed HTML are committed together.

## Clinical decisions approved in this conversation

1. Chronic daily ceiling: **10 mEq/L per 24 hours**. The published AAHA range remains documented; 12 is not enabled as another approved choice.
2. Proposed eventual target: **158 mEq/L**, editable. No dog/cat laboratory interval was supplied. This value is labeled as owner-selected, requires case confirmation without a laboratory interval, and is not presented as universally high-normal. A complete clinician-entered laboratory interval/source defaults an unedited target to its upper end; an explicit button can reapply that upper limit after manual target editing. Species changes clear the laboratory configuration/confirmation.
3. Conservative sparse-history allowance: sum measured declines, give no credit for rises, and count the entire boundary-straddling measurement interval. This owner-approved application policy can overestimate correction; it is **not an AAHA formula**, an exact rolling net change, or proof of daily safety. Entering a new plan or crossing midnight does not reset it.

## Source verification

Retrieved and inspected the exact [AAHA 2024 Section 5 page](https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-5-fluid-therapy-in-ill-patients/) on November 3, 2026, after initially blocked requests succeeded on retry:

- **Table 12C:** LRS Na 130, Plasma-Lyte A Na 140, Normosol R Na 140, 0.9% NaCl Na 154 mEq/L.
- **Table 13A:** free-water deficit in liters = `[(patient Na / desired Na) − 1] × (0.6 × kg)`; chronic decline no more than 0.5 mEq/L/hr and maximum total correction 10–12 mEq/L/day. It distinguishes treatment of hypovolemia, free-water replacement and concurrent dehydration management, and states 4–6-hour sodium rechecks. The interface's editable 4-hour proposal is not a guarantee that this interval suits every case.
- Table 13A also gives the existing acute replacement-time reference `patient Na − target Na` hours. That free-water/time reference remains available when confirmed acute is selected. Automatic acute next-interval prescribing is **withheld**; the chronic hourly/daily settings are inactive in that context. A complete acute interval/monitoring protocol still needs clinician approval.
- The low-sodium response estimate retains the site's existing approximate per-liter sodium-plus-potassium equation; scaling to planned volume is explicitly an estimate. Neither it nor free-water arithmetic predicts changing renal handling or losses.

Product sodium values were cross-checked against AAHA Table 12C. Product labels separately checked for carrier Na/K used by the response estimate:

- [B. Braun LRS label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=aad6e18f-04f8-4799-b366-873ec5a50317): Na 130, K 4 mEq/L.
- [Baxter Veterinary Plasma-Lyte A label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ed80c6f-7d6e-416e-912a-a12a24c210f6): Na 140, K 5 mEq/L.
- [ICU Medical Normosol-R label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0e089a44-0cee-4804-8f6f-8508508ddb5c): Na 140, K 5 mEq/L.

Actual bags, additives, compatibility and patient-specific suitability still require verification. No new bolus doses, laboratory ranges or acute treatment thresholds were introduced.

## Independent expected examples

For a 10 kg patient, latest Na 180, eventual target 158, chronic selected decline 0.5, approved daily ceiling 10 and sufficient allowance:

- Four-hour target: **178 mEq/L**.
- Eventual free-water deficit: **835.4430379746835 mL**.
- Next-interval water equivalent: **67.41573033707865 mL**; this is not a sodium-containing crystalloid volume.
- Overall estimated duration: max(22 ÷ 0.5, 22 × 24 ÷ 10) = **52.8 hours**. A custom 44-hour plan meets 0.5 hourly but exceeds the approved daily ceiling; the warning remains.
- With only 5 mEq/L of current allowance remaining, the same eventual target produces a conservative **105.6-hour** reference estimate (22 × 24 ÷ 5). A custom 52.8-hour plan still warns about the existing measured-history allowance, even though its hourly and nominal daily arithmetic alone would pass.
- A trajectory 180 → 177 over 6 hours → 178 over 1 hour → 176 over 2 hours has a latest observed decline **1 mEq/L/hr**, net total decline **4 mEq/L**, counted falls **5 mEq/L**, remaining planning allowance **5 mEq/L**, and incomplete 24-hour history. The rebound does not replenish allowance.

## Verification

- Full baseline suite passed before editing. The complete suite was rerun after completed updates; final suite passes syntax, all root regressions and static integrity for all 17 pages.
- `check-sodium-plan.cjs` adds independent water/target/duration expectations, target floor, hourly AND daily constraints, custom-hour warnings, invalid/extreme values, chronological timestamps, actual elapsed time, rising/falling direction, conservative rolling/partial history, midnight invariance and acute gating. Existing pure `freeWater` examples remain unchanged for the Original Sheet and acute reference.
- Previous high-sodium UI assertions for the old automatically displayed free-water-only pump rate were replaced because that ambiguous UI output was intentionally removed. The original numerical `freeWater` assertions are retained. The new real-browser checks independently verify the replacement outputs and live shared-weight behavior. Low-sodium assertions were retained; the maintenance browser script now explicitly selects its pathway before interacting with it.
- `scripts/check-sodium-browser.cjs` passes in Chromium: both pathways, default/edited targets, actual sample times, future/duplicate timestamps, invalid draft/reload, retained history after new prescriptions and clear preparation, new patient after navigation/back, independent water results after weight changes, approved daily/custom-hour warnings, acute reference without chronic planning, laboratory/species behavior, stale/overdue plans, no automatic shared-rate edits, explicit transfer, keyboard order, wheel protection, 390px layout and three PDF text checks.
- Existing `scripts/check-clinical-browser.cjs` passes across all 17 pages at desktop/phone widths. Existing `scripts/check-maintenance-browser.cjs` passes across every calculator, including original dose verification and seven representative print references.
- Repeated CRI generation plus complete checks pass twice in an isolated temporary copy. The sodium adapter is also run directly, preserving matching generated markup.
- Populated high/low screenshots and rendered print output were visually inspected. No JavaScript page errors occurred in browser checks.

## Screenshots

All images use synthetic inputs, not patient information.

- [High sodium · ready interval prescription, desktop](docs/sodium-review/high-desktop.png)
- [High sodium · ready interval prescription, phone](docs/sodium-review/high-mobile.png)
- [Low sodium · existing preparation/response tools](docs/sodium-review/low-desktop.png)
- [Low sodium · phone](docs/sodium-review/low-mobile.png)
- [High sodium · first printed page](docs/sodium-review/print-first-page.png)

## Remaining decisions and limits

- A complete confirmed-acute interval/monitoring protocol remains a clinical decision; the existing source-supported acute free-water/time estimate is retained separately.
- Real species-specific laboratory intervals remain unconfigured. The supplied 158 target does not establish an interval.
- Sparse measurements, unrecorded treatment and changing water/solute balance prevent a complete 24-hour safety assessment. Boundary-bracketed results are labeled conservatively rather than interpolated or claimed exact.
- The original-sheet workbook page remains a nominal historical reference; its existing arithmetic is unchanged. The new sodium clinical workflow is the interval/history tool.
- Browser checks cover Linux Chromium, desktop/narrow viewports and generated PDFs. Safari, Firefox, physical printers, real mobile keyboards, assistive-technology testing and bedside clinical validation were not performed. Date/time entry uses the browser's local timezone; moving sessions between timezones requires re-verification of timestamps.
- Timed history persists only in the browser tab session and is not a medical record or medication administration record.

Passing software tests does not establish complete clinical validation. Nothing is to be merged or deployed automatically.
