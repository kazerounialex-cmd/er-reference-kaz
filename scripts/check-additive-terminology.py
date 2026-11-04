"""Check visible terminology without renaming calculation inputs or source data."""
from pathlib import Path
import runpy
ROOT = Path(__file__).resolve().parents[1]
ns = runpy.run_path(str(ROOT / 'scripts/additive-terminology.py'), run_name='terminology_test')
VisibleTerms = ns['VisibleTerms']
fixture = '<label for="kStock">KCl stock <input id="kStock" data-stock aria-label="KCl stock concentration"></label><p>Base fluid</p><script>const stock=2;</script>'
expected = '<label for="kStock">KCl additive <input id="kStock" data-stock aria-label="KCl additive concentration"></label><p>Base fluid</p><script>const stock=2;</script>'
assert VisibleTerms(fixture).render() == expected
assert VisibleTerms(expected).render() == expected
for page in (ROOT / 'dist').glob('*.html'):
    parsed = VisibleTerms(page.read_text())
    assert not parsed.edits, f'{page.name}: legacy additive terminology remains in visible text or accessible labels'
print('Terminology passed: all page text/accessibility labels, preserved identifiers/scripts/base-fluid wording and idempotent generation.')
