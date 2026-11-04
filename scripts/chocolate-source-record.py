"""Keep the directly verified chocolate source record consistent after generation."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
DETAILS = (ROOT / 'scripts/chocolate-sources.html').read_text().strip()
SUMMARY = '''<section class="panel" id="chocolate-source"><h2>Chocolate toxicity</h2><p><a href="chocolate.html#chocolate-sources">Calculator source record and concentration table</a>: Merck Veterinary Manual, Chocolate Toxicosis in Animals, February 2026, supplies the retained total-methylxanthine concentrations, cocoa-% approximation and canine dose references. The four-hour emesis window is clinician-selected; Merck describes recent exposure (eg, within two hours). The existing Merck charcoal caution is retained.</p><p><a href="https://pubmed.ncbi.nlm.nih.gov/33788297/">Weingart, Hartmann &amp; Kohn (2021)</a>, <a href="https://doi.org/10.1111/jsap.13329">doi:10.1111/jsap.13329</a>, provides observational context from 156 chocolate-ingestion events. Abstract reviewed; full text not verified. This series does not establish a treatment protocol or validate calculator thresholds. Numeric dose references do not establish safety or predict death.</p></section>'''
for filename, pattern, replacement in [
    ('chocolate.html', r'<details class="panel" id="chocolate-sources">.*?</details>', DETAILS),
    ('sources.html', r'<section class="panel" id="chocolate-source">.*?</section>', SUMMARY),
]:
    path = ROOT / 'dist' / filename
    text, count = re.subn(pattern, lambda _: replacement, path.read_text(), flags=re.S)
    if count != 1:
        raise ValueError(f'{filename}: expected exactly one chocolate source record, found {count}')
    path.write_text(text)
