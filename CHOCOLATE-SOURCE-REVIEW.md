# Chocolate source review

The supplied background article was used to identify references and compare the existing implementation. Its PDF, text and illustrations are not redistributed. Public citations point to sources actually consulted; a citation in a background review is not treated as verification of the underlying publication.

## Findings and retained behavior

- Exposure arithmetic is total methylxanthines (theobromine plus caffeine) divided by patient kg. Products sum before division. No formula error was identified.
- Current Merck concentrations remain: milk 2.3, generic dark 5.3–5.6, unsweetened baking 15.5, cocoa powder 28.5, white 0.04 and cocoa hulls 9 mg/g. The retained cocoa-% approximation is 15.5 × cocoa fraction mg/g; Merck explicitly gives a 65% example. It is not a product assay.
- The supplied review also uses a proportional cocoa-% estimate, but its unsweetened-chocolate basis is 400 mg/oz. That is about 14.11 mg/g, rather than the retained Merck 15.5 mg/g. Substituting datasets would change results; this is a source/model difference, not a conversion bug. No concentration substitution was made.
- Existing 20, 40–50 and ≥60 mg/kg references broadly agree with the background review. Its separate caffeine/theobromine lethal-dose discussion must not be substituted for combined exposure or treated as an individual death threshold. Existing Merck bands and outcome cautions remain.
- The supplied review discusses later emesis and broader/repeated charcoal use. Original source text for these treatment recommendations was not independently obtained. The already approved four-hour emesis reference stays explicitly clinician-selected. The veterinarian’s later choice to retain Merck’s restrictive charcoal caution takes precedence; no dosing or repeat-charcoal recommendation was added.

## Direct source verification

1. [Merck Veterinary Manual: Chocolate Toxicosis in Animals](https://www.merckvetmanual.com/toxicology/food-hazards/chocolate-toxicosis-in-animals). Full page inspected: concentrations, cocoa-% example, dog reference bands, variability, recent-exposure emesis example and charcoal/dehydration/hypernatremia caution.
2. Weingart C, Hartmann A, Kohn B. *Chocolate ingestion in dogs: 156 events (2015–2019).* J Small Anim Pract. 2021;62:979–983. [PMID 33788297](https://pubmed.ncbi.nlm.nih.gov/33788297/), [doi:10.1111/jsap.13329](https://doi.org/10.1111/jsap.13329). Original abstract verified via Europe PMC/PubMed metadata. Reports 44 affected dogs, 112 without clinical signs, and 43 survivors among the 44 affected dogs after treatment. This is observational context, not validation of thresholds or efficacy of a treatment protocol. The repository full-text link encountered an access challenge; full text was not verified.
3. Bates, Rawson-Harris & Edwards (2015), [doi:10.1111/jsap.12343](https://doi.org/10.1111/jsap.12343): bibliographic record and abstract verified only. The abstract does not substantiate a specific emesis window or charcoal regimen, so it is not cited publicly for those claims.
4. Dolder’s textbook chapter, Ramli’s analytical study, Gwaltney-Brant’s older review and Volmer/Rosendale’s management review remain unverified at original-text level. They are not presented as directly checked public sources.

## Implemented improvements and limits

The expandable Sources & assumptions now contains a concentration table generated from the same unrounded data as the calculator. Ounce equivalents use the exact conversion and approximate display; they are not silently mixed with a separately rounded published mg/oz dataset. Shared source markup is used by generation and the existing-page adapter. The central source record now distinguishes Merck calculation assumptions, observational evidence and the clinician-selected emesis window.

Regression examples independently cover all six retained concentrations and the 65% cocoa example. Existing clinical behavior, formulas, source coefficients, default inputs, thresholds and guidance are preserved. Software checks and this source comparison are not complete clinical validation.
