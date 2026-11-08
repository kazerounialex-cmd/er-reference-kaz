"""Maintain the editable blood log alongside the clean printable cage sheet."""
from pathlib import Path
import runpy
ROOT=Path(__file__).resolve().parents[1]
ns=runpy.run_path(str(ROOT/'scripts/compact-electrolytes.py'));P=ns['P']
p=ROOT/'dist/blood-collection.html';r=P(p.read_text()).root
if not r.all(lambda n:n.attrs.get('id')=='bloodDrawForm'):
 panel=P('''<section class="panel blood-draw-panel" aria-labelledby="bDrawHeading"><h2 id="bDrawHeading">Blood draw log</h2><p class="help">Fill in draws here, then print or export. Include discarded blood; exclude saline flushes. Entries stay in this browser tab. New patient clears the log.</p><form id="bloodDrawForm"><div class="table-wrap blood-draw-scroll" tabindex="0" role="region" aria-label="Editable blood draw log — scroll for all columns and rows"><table class="blood-draw-table"><caption>16 rows · sheet totals only; reconcile prior draws and other sheets separately.</caption><thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Blood removed · mL</th><th scope="col">Sheet total · mL</th><th scope="col">Draw site</th><th scope="col">Test / reason</th><th scope="col">Initials</th><th scope="col">Edit</th></tr></thead><tbody id="bDrawRows"></tbody></table></div></form><p id="bDrawStatus" class="help" role="status"></p><p id="bDrawStorage" class="help" role="status"></p></section>''').root.children[0]
 main=r.byid('main-content');form=r.byid('bloodForm');main.add(panel,main.children.index(form)+1)
r.one(lambda n:n.tag=='p' and n.cls('intro')).children=['Uses the shared patient above. Review collection guides, record draws below, then print or export the completed sheet.']
r.byid('bDrawHeading').attrs['tabindex']='-1'
if not r.all(lambda n:n.cls('blood-draw-jump')):
 actions=r.byid('bPrint').parent;actions.add(P('<a class="blood-draw-jump" href="#bDrawHeading">Enter draws ↓</a>').root.children[0],0)
r.byid('bExportStatus').children=['Entered draws are included in preview, print/PDF and exports. Unused rows remain blank for handwriting.']
r.byid('bloodForm').one(lambda n:n.tag=='button' and n.attrs.get('type')=='reset').children=['Reset collection plan · keep draw log']
p.write_text(r.render())
s=p.read_text()
if 'src="blood-log-calc.js"' not in s:s=s.replace('<script src="blood-calc.js">','<script src="blood-log-calc.js"></script><script src="blood-calc.js">')
if 'src="blood-log.js"' not in s:s=s.replace('<script src="blood-collection.js">','<script src="blood-log.js"></script><script src="blood-collection.js">')
p.write_text(s)

source=ROOT/'dist/sources.html'
source.write_text(source.read_text().replace('a printable blank draw log, and exports.','a fillable draw log with sheet running totals, clean printing and exports. Rolling totals remain clinician-reconciled.'))
