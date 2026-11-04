# Preparation terminology

Use **additive** for the drug or electrolyte being added, its vial concentration and its measured preparation volume. Use **base fluid** or **carrier** for the fluid receiving that additive. Reserve “stock” for the base fluid; prefer the explicit labels “base fluid” or “carrier.” Do not label a drug/electrolyte concentrate “stock” in the interface.

Reviewed and updated: potassium, magnesium, phosphate, sodium, dextrose, all CRIs, drug-reference rows, Original Sheet labels, concentration locks, worked equations, preparation-verification messages, source explanations, accessible labels and generated print charts. The existing blank blood-collection PDF contains no such terminology.

`scripts/additive-terminology.py` is the final presentation step for generated HTML, including accessible labels. It preserves input IDs, calculation properties, script bodies and source links. Dynamic preparation text is maintained in the existing JavaScript controllers. Legacy internal names such as `stock`, `kStock` and `stockVolume` remain calculation/data identifiers; they do not label the user-facing preparation.

The potassium rounding message ends with the recommended reduced additive volume and its revised rate. The detailed reduction math remains verified internally; the message omits concentration and final-volume detail. The approved warning/allowance thresholds and automatic-calculation behavior are unchanged.

Validation includes independent numerical examples, conversion/idempotence checks, screen and print terminology audits and regeneration. No application dependency was added.
