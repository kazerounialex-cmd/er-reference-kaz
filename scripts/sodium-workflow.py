"""Install the sodium workflow from its canonical fragment; safe after legacy generators."""
from pathlib import Path
import runpy
R=Path(__file__).resolve().parents[1]
# Reuse the site's small HTML tree adapter (already compact pages are untouched).
helpers=runpy.run_path(str(R/'scripts/compact-electrolytes.py'))
P,N=helpers['P'],helpers['N']
p=R/'dist/sodium.html';root=P(p.read_text()).root;main=root.byid('main-content')
mix=root.byid('mixingTool');mix.remove()
existing=root.all(lambda n:n.attrs.get('id')=='sodiumWorkflow')
if existing:
 existing[0].parent.remove() # old hyperWorkflow wrapper; recreate from source
else:
 root.byid('hyperWorkflow').remove()
 patient=main.one(lambda n:n.tag=='form')
 # Preserve measured patient sodium for the existing low-sodium calculators.
 current=root.byid('nCurrent').parent;current.remove();patient.remove()
 low=N('form',[('data-electrolyte',None),('class','panel')]);low.add(N('h2',children=['Hyponatremia · measured patient sodium']));low.add(current)
 root.byid('hypoWorkflow').add(low,0)
 old=main.one(lambda n:n.cls('workflow-grid'));pos=main.children.index(old);old.remove()
 choices=P('''<div class="sodium-paths" role="group" aria-label="Select sodium pathway"><button type="button" data-path="hyper" aria-pressed="true">High sodium / Hypernatremia</button><button type="button" data-path="hypo" aria-pressed="false">Low sodium / Hyponatremia</button></div>''').root.children[0];main.add(choices,pos)
fragment=P((R/'scripts/sodium-workflow.html').read_text()).root.children[0]
high=N('section',[('id','hyperWorkflow')]);high.add(fragment)
main.add(high,main.children.index(root.byid('hypoWorkflow')))
fragment.byid('sAdvancedMix').add(mix)
for node in main.all(lambda n:n.tag=='p' and n.cls('intro')):node.children=['Identify high or low sodium → assess perfusion → recheck → plan the next interval → monitor and adjust.']
if not root.all(lambda n:n.tag=='link' and n.attrs.get('href')=='sodium.css'):
 root.one(lambda n:n.tag=='head').add(N('link',[('rel','stylesheet'),('href','sodium.css')]))
for src in ['sodium-plan.js','sodium-workflow.js']:
 for old in root.all(lambda n:n.tag=='script' and n.attrs.get('src')==src):old.remove()
 root.one(lambda n:n.tag=='body').add(N('script',[('src',src)]))
for old in root.all(lambda n:n.attrs.get('id')=='sodiumWorkflowSources'):old.remove()
main.add(P('''<section class="panel" id="sodiumWorkflowSources"><h2>Sources & clinical configuration</h2><p><a href="https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-5-fluid-therapy-in-ill-patients/">AAHA 2024 Fluid Therapy Guidelines · Section 5, Tables 12C and 13A</a> · <a href="sources.html#sodium-source">Existing workbook assumptions and sodium sources</a>.</p><p>Existing chronic reference: ≤0.5 mEq/L/hr and 10–12 mEq/L per 24 hours. Owner-approved daily ceiling: 10 mEq/L per 24 hours (November 3, 2026). Owner-selected proposed eventual target: 158 mEq/L, editable and requiring case confirmation when no laboratory interval is configured; this is not a validated reference interval. Confirmed acute retains the existing AAHA free-water/time estimate; automatic next-interval prescribing is withheld pending an approved acute monitoring/correction protocol. Fluid reference values and the 0.6 body-water fraction retain the existing site assumptions. AAHA Tables 12C/13A were retrieved and checked November 3, 2026. Product references: <a href="https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=aad6e18f-04f8-4799-b366-873ec5a50317">LRS label</a> · <a href="https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ed80c6f-7d6e-416e-912a-a12a24c210f6">Veterinary Plasma-Lyte A label</a> · <a href="https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0e089a44-0cee-4804-8f6f-8508508ddb5c">Normosol-R label</a>. Labels confirm LRS Na/K 130/4 and Plasma-Lyte A/Normosol-R 140/5 mEq/L. Verify the actual bag and any additives. The conservative sampled-history allowance was approved by the owner November 3, 2026; it is an application planning bound, not an AAHA formula. Software tests are not clinical validation.</p></section>''').root.children[0])
p.write_text(root.render())
