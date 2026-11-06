# Unavailable result review

The review distinguishes a missing/invalid input, an impossible preparation, a clinical reference restriction, and an optional feature. A disabled choice now has a short reason in visible text, rather than relying on its color or a mouse tooltip.

## Findings and changes

| Severity | Area | Finding and action |
| --- | --- | --- |
| Moderate | Mg, phosphate and dextrose | Chart catches discarded the reason for unavailable rates/mixtures. Keep each exception and show it beside its disabled choice, connected with `aria-describedby`. Clear the note when the choice becomes available. |
| Moderate | Phosphate and concurrent K | At 0.5 mEq/kg/hr additional K, KPhos choices disappeared without explaining the combined total. Show the total in the reason; add the clinician-requested, default-off combined-K override. Nominal and displayed-preparation checks retain their default blocks. |
| Minor | KCl | Missing inputs suppressed per-choice reasons. Show the specific missing/invalid field and replace stale rounding/conflict text. Existing dose limits and rounding allowance are unchanged. |
| Minor | Insulin | A species-restricted preset could be disabled without an adjacent reason. Explain the existing species restriction; do not enable another species' reference. |
| Minor | Drug rows | Missing patient data or a blank dose produced a bare dash. Show a short explanation in that result cell. |
| Minor | Blood collection | Disabled export buttons had their reason elsewhere. Add a nearby explanation connected to the buttons. |
| Minor | Reglan | The optional additive-rate equivalent silently vanished when unavailable. Explain missing weight/additive concentration. |

## Phosphate override scope

The user explicitly requested an override of the combined 0.5 mEq/kg/hr K block. It changes whether the standalone page permits a calculation, not the reference limit or recommended dose ranges. Both nominal and rounded displayed total K remain calculated. An active override is identified in the selected preparation, including print output. Choosing a phosphate dose is allowed while it is active.

The exception requires an explicit checkbox and is not saved. Patient weight/species, fluid rate/volume, additive concentrations, preparation method, additional K rate or its inclusion status changes clear it. Clear preparation, New patient and navigation/history restoration clear it as well. Shared-source records retain only the verified KPhos contribution; existing combined-source warnings remain in force.

The override cannot bypass missing/invalid values, impossible dilution, numeric overflow/underflow or the supported phosphate-dose range. No other clinical restriction was relaxed.

## Other areas reviewed

Sodium fluid cards already identify unattainable mixtures; the selected mixture and sodium-response sections explain missing requirements. Bag time can remain available when the falling-sodium reference is inapplicable, with an explanation. Chocolate provides exposure/species errors and per-product concentration context. CRI, fentanyl, blood collection and local-anesthetic preparations already show calculation exceptions. The Original Sheet retains its visible section-error list and cell error descriptions. Optional empty log entries and unselected tracker samples are not failed calculations.

## Verification

Run `node scripts/check-all.cjs` and `python3 scripts/check-generators.py`. New independent arithmetic regression: `check-phosphate-override.cjs`, including 0.5880 combined K, a nominally-under-limit preparation whose rounded quantities deliver 0.50026, explicit-only overrides, and retained invalid/physical checks. Existing numeric expectations were retained; two bare-dash/hidden-reason UI expectations now require the explanatory text.

With Playwright/Chromium and a local static server: `ER_REFERENCE_TEST_URL=http://127.0.0.1:8000 node scripts/check-unavailable-browser.cjs`. The broader clinical/maintenance, phosphate-link and magnesium browser suites cover the remaining calculators and interactions. Browser checks and generated print references are software checks, not complete clinical validation or an endorsement of dosing above the potassium reference limit.
