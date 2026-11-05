# Phosphate / KCl accounting

The additional-K input previously had no page-session persistence and was inside a collapsed setting. It now appears near the top, defaults to the patient's verified KCl-only contribution, and permits an explicit manual override. The concurrent-use checkbox controls whether it enters the phosphate preparation; selecting a dose alone does not activate an infusion. A previous explicit KCl concurrent confirmation can be retained for the same valid source.

`phosphate-kcl.js` stores link mode, manual value, confirmation, patient context and source signature in the tab session. The effective `pOtherK` calculation input remains separate from the visible editable rate. Shared number caching preserves full precision. Source snapshots already exclude other K credited in the KCl calculator, so importing the KCl-only rate does not count KPhos twice.

Changes to a valid linked preparation require confirmation again. Invalid or stale linked data clears dependent calculations while confirmed; it does not leave the previous valid total displayed. Manual override remains independent of calculator changes. “Use KCl calculator” reconnects. “Clear preparation” clears the local override/confirmation; “New patient” clears all patient-specific state, including restored history entries.

Valid KCl preparation inputs also restore on navigation for the same patient and fluid rate. Cleared/invalid preparations do not restore. The optional full source reconciliation remains available and will flag a manual rate that differs from its verified calculator counterpart; a manual override does not overwrite that counterpart's preparation.

The clinician-selected peripheral concentration limit is 0.2 mEq/mL (200 mEq/L), with at/above-limit text. Native carrier potassium remains excluded. This concentration limit is separate from KCl dose-rate/rounding limits and the existing 0.5 mEq/kg/hr combined phosphate/K guard. It is not attributed to the references documenting other concentration guidance.

Validation covers independent source-rate and total examples, no duplicate K counting, exact-rate caching, manual override/relink persistence, changed/invalid source, patient/history/reset behavior, and peripheral concentration boundaries. Run the full suite, generator checks and `scripts/check-phosphate-kcl-browser.cjs`; these are software checks, not complete clinical validation.
