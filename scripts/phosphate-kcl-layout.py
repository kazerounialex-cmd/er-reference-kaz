"""Prominent KCl accounting; preserve calculator input IDs and clinical math."""
from pathlib import Path
import runpy
ROOT=Path(__file__).resolve().parents[1]
ns=runpy.run_path(str(ROOT/'scripts/compact-electrolytes.py'));P,N=ns['P'],ns['N']
p=ROOT/'dist/phosphate.html';r=P(p.read_text()).root
if not r.all(lambda n:n.attrs.get('id')=='pKclPanel'):
 old=r.byid('pOtherK').parent
 old.attrs['hidden']=None
 box=P('''<section class="phosphate-kcl-panel" id="pKclPanel" aria-labelledby="pKclHeading"><h3 id="pKclHeading">Additional potassium from KCl</h3><div class="phosphate-kcl-controls"><label>KCl rate <span>mEq/kg/hr</span><input id="pKclRate" type="number" min="0" step="any" aria-describedby="pKclLinkStatus" placeholder="KCl calculator or manual rate"></label><button type="button" id="pKclUseCalculator">Use KCl calculator</button><a href="potassium.html">Open KCl calculator ↗</a></div><label class="phosphate-kcl-confirm"><input id="pKclActive" type="checkbox"> KCl is running concurrently — include it</label><p id="pKclLinkStatus" class="help" role="status"></p><strong id="pKclTotal" role="status">Total potassium: —</strong><p class="help">Separate infusions only; this does not calculate KCl mixed into the KPhos bag. Only confirmed additional K is counted.</p></section>''').root.children[0]
 inputs=r.one(lambda n:n.cls('compact-inputs'));inputs.add(box,1)
controls=r.one(lambda n:n.cls('phosphate-kcl-controls'))
if not controls.all(lambda n:n.tag=='a'):
 controls.add(N('a',[('href','potassium.html')],['Open KCl calculator ↗']))
options=r.one(lambda n:n.cls('phosphate-options'))
options.one(lambda n:n.tag=='summary').children=['Preparation method']
for note in options.all(lambda n:n.tag=='p' and n.cls('help')):
 note.children=['Carrier potassium is excluded. Additional K from separate infusions is entered above; KCl co-mixing in the KPhos bag is not calculated.']
# Keep the older full source reconciliation available as optional detail.
advanced=r.byid('concurrentPotassium')
if advanced.tag!='details':
 advanced.tag='details';heading=advanced.one(lambda n:n.tag=='h2');heading.tag='summary';heading.children=['Optional · full potassium-source reconciliation']
body=r.one(lambda n:n.tag=='body')
if not r.all(lambda n:n.tag=='script' and n.attrs.get('src')=='phosphate-kcl.js'):
 body.add(N('script',[('src','phosphate-kcl.js')]))
p.write_text(r.render())

sources=ROOT/'dist/sources.html';sr=P(sources.read_text()).root
if not sr.all(lambda n:n.attrs.get('id')=='phosphateKclSource'):
 sr.byid('phosphate-source').add(N('p',[('id','phosphateKclSource')],['Additional KCl can link to the verified KCl preparation for this patient, excluding K already credited from other infusions. A manual override and concurrent-use confirmation are retained in this tab. Changed or invalid linked inputs require review; New patient clears the link and override. The existing combined supplemental-K limit remains 0.5 mEq/kg/hr.']))
sources.write_text(sr.render())
