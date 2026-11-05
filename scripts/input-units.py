"""Attach the shared presentation-only unit adornments after page scripts."""
from pathlib import Path
for p in (Path(__file__).resolve().parents[1]/'dist').glob('*.html'):
 s=p.read_text()
 if 'src="input-units.js"' not in s:s=s.replace('</body>','<script src="input-units.js"></script></body>')
 p.write_text(s)
