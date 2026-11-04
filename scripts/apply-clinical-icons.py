"""Update only illustrations; preserve the current page's clinical text and layout."""
from pathlib import Path
import re
import runpy

root = Path(__file__).resolve().parents[1]
render = runpy.run_path(str(root / 'scripts/clinical-icons.py'))['render_icon']
page = root / 'dist/chocolate.html'
pattern = r'(<article\b[^>]*data-choc-band="([^"]+)"[^>]*>)\s*<svg\b.*?</svg>'
text, count = re.subn(pattern, lambda m: m[1] + render(m[2]), page.read_text(), flags=re.S)
if count != 5:
    raise ValueError(f'Expected five chocolate reference illustrations, found {count}.')
page.write_text(text)
