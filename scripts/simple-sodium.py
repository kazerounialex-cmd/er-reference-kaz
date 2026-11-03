"""Workbook-style sodium reference; presentation source, run after the shared finalizer."""
from pathlib import Path
import runpy
R=Path(__file__).resolve().parents[1]
h=runpy.run_path(str(R/'scripts/compact-electrolytes.py'));P,N=h['P'],h['N']
p=R/'dist/sodium.html';root=P(p.read_text()).root;main=root.byid('main-content');body=root.one(lambda n:n.tag=='body')
if not body.cls('sodium-simple'):
 body.addcls('sodium-simple')
 choices=main.one(lambda n:n.cls('workflow-grid'));pos=main.children.index(choices)
 guidance=N('details',[('class','panel'),('id','sodiumGuidance')]);guidance.add(N('summary',children=['Optional guidance & response estimate']))
 for card in choices.all(lambda n:n.cls('workflow-card')):
  for checklist in list(card.all(lambda n:n.cls('workflow-checklist'))):guidance.add(checklist)
 choices.remove()
 main.add(P('''<div class="simple-sodium-paths" role="group" aria-label="Sodium pathway"><button type="button" data-path="hyper" aria-pressed="true">High sodium / Hypernatremia</button><button type="button" data-path="hypo" aria-pressed="false">Low sodium / Hyponatremia</button></div>''').root.children[0],pos)
 # Keep the measured patient sodium shared by the existing reference calculations.
 patient=main.one(lambda n:n.tag=='form');patient.addcls('simple-sodium-context')
 h['heading'](patient,'Patient sodium')
 context=root.byid('nType').parent;context.remove()
 root.byid('nGoal').parent.parent.add(context,0)
 helptext=patient.one(lambda n:n.tag=='p');helptext.children=['Use the shared weight/species above. Patient sodium is needed for the D5W estimate and optional response calculation; fluid preparation can be used independently.']
 # Hypernatremia: one small input panel beside its D5W result and visible math.
 high=root.byid('hyperWorkflow');notice=high.one(lambda n:n.cls('notice'));notice.children=['Chronic / unknown: ≤0.5 mEq/L/hr and selected 10 mEq/L per 24 hours. Address hypovolemia separately; free-water deficit is not a bolus or automatically additional to the full dehydration deficit.']
 form=high.one(lambda n:n.tag=='form');h['heading'](form,'D5W · free-water replacement')
 root.byid('nGoal').attrs['value']='158'
 root.byid('nGoal').parent.children[0]='Patient Na target '
 helptext=form.one(lambda n:n.tag=='p');helptext.children=['Blank hours uses the longer time required by the hourly and daily limits. The editable proposed target 158 mEq/L is not a validated laboratory upper limit. Confirm the target for this patient.']
 for button in form.all(lambda n:n.tag=='button' and n.attrs.get('type')=='reset'):button.children=['Clear D5W inputs']
 result=root.byid('nWaterSection');h['heading'](result,'D5W reference · mL/hr')
 # Preserve low-sodium guidance; main preparation uses the same verified mixing engine.
 low=root.byid('hypoWorkflow');low.remove();guidance.add(low)
 response=root.byid('hypoPlan');response.remove();guidance.add(response)
 mix=root.byid('mixingTool');mix.remove();main.add(mix,main.children.index(high)+1)
 h['heading'](mix,'Crystalloid preparation · specified final volume')
 root.byid('nVolume').attrs['value']='1000'
 main.add(guidance)
 # Results and math stay on the page; no checkboxes or treatment recording gates.
 for id in ['nWaterMath','nMixMath','hResponseMath','nQuickMath','nGlucoseMath']:
  math=root.byid(id);math.tag='section';summary=math.one(lambda n:n.tag=='summary');summary.tag='h3';summary.children=['Worked math']
 for detail in mix.all(lambda n:n.cls('fluid-card-details')):
  detail.tag='div';detail.one(lambda n:n.tag=='summary').remove()
 main.add(guidance,main.children.index(main.one(lambda n:n.tag=='footer')))
 tracker=P('''<details class="panel" id="sodiumTracker"><summary>Optional sodium tracker · clinician monitoring aid</summary><p class="help">Independent notes only: adding a sample never changes the reference calculations or shared fluid plan. This is not a complete 24-hour safety assessment or medical record.</p><form id="naTrackerForm" novalidate><div class="patient-grid"><label>Measured Na · mEq/L<input id="naSample" type="number" min="0.001" step="any" aria-describedby="naTrackerError"></label><label>Sample date/time · local<input id="naTime" type="datetime-local" aria-describedby="naTrackerError"></label></div><button type="submit">Add sample</button><p id="naTrackerError" class="critical-note" role="status"></p></form><div id="naTrackerResult" aria-live="polite"></div><div class="table-wrap"><table><caption>Recorded samples · this tab only</caption><thead><tr><th scope="col">Time</th><th scope="col">Na · mEq/L</th><th scope="col">Change</th><th scope="col">mEq/L/hr</th></tr></thead><tbody id="naTrackerRows"></tbody></table></div><p class="help">Times and sodium values are clinician-entered. Earlier results are retained when adding samples. New patient clears the tracker. The calculator does not automatically use these readings.</p></details>''').root.children[0]
 main.add(tracker,main.children.index(guidance)+1)
 main.add(P('''<p class="help sodium-reference-source"><a href="https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-5-fluid-therapy-in-ill-patients/">AAHA 2024 Section 5 · Tables 12C and 13A</a> · <a href="sources.html#sodium-source">Sodium sources & assumptions</a>. LRS Na 130, Plasma-Lyte / Normosol-R 140, 0.9% NaCl 154 mEq/L; verify the actual product. Preparation and response estimates do not replace clinician monitoring.</p>''').root.children[0],main.children.index(main.one(lambda n:n.tag=='footer')))
 main.one(lambda n:n.tag=='p' and n.cls('intro')).children=['Fluid preparation, correction time and rate—like the workbook. All worked math is shown; monitoring remains with the clinician.']
 root.one(lambda n:n.tag=='head').add(N('link',[('rel','stylesheet'),('href','sodium-simple.css')]))
 root.one(lambda n:n.tag=='body').add(N('script',[('src','sodium-simple.js')]))
context=root.byid('nType').parent;parent=context.parent;context.remove();parent.add(context,parent.children.index(parent.one(lambda n:n.tag=='h2'))+1)
if not root.all(lambda n:n.attrs.get('id')=='nDailyLimit'):
 label=P('<label>Daily correction ceiling <span>mEq/L per 24 hours</span><select id="nDailyLimit"><option value="10">10 (default)</option><option value="11">11</option><option value="12">12</option></select></label>').root.children[0]
 parent.add(label,parent.children.index(context)+1)
root.byid('hyperWorkflow').one(lambda n:n.cls('notice')).children=['Chronic / unknown: ≤0.5 mEq/L/hr and the selected daily ceiling (10–12 mEq/L per 24 hours). Address hypovolemia separately; free-water deficit is not a bolus or automatically additional to the full dehydration deficit.']
for para in list(root.byid('nWaterSection').all(lambda n:n.tag=='p')):
 if ''.join(c for c in para.children if isinstance(c,str)).startswith('Estimated water needed to reach the patient target.'):para.remove()
waterform=root.byid('nGoal').parent.parent
waterform.one(lambda n:n.tag=='p').children=['Blank hours: chronic ≤0.5 mEq/L/hr and the selected daily ceiling; acute uses the existing 1 mEq/L/hr estimate. Proposed target 158 is not a laboratory reference; edit for this patient.']
for opt in root.byid('nPreset').all(lambda n:n.tag=='option' and n.attrs.get('value')=='0'):opt.children=['D5W — sodium-free replacement · 0 mEq/L']
# Keep the workbook's add-on quick reference beside patient sodium.
if not root.all(lambda n:n.attrs.get('id')=='sodiumQuickReference'):
 patient=main.one(lambda n:n.tag=='form' and n.cls('simple-sodium-context'))
 pos=main.children.index(patient);patient.remove()
 top=N('div',[('class','simple-sodium-top')]);main.add(top,pos);top.add(patient)
 top.add(P('''<section class="panel" id="sodiumQuickReference" aria-label="Rough bolus-fluid preparation reference"><h2>Bolus-fluid preparation · rough reference</h2><table><caption>0.9% NaCl + 7.2% NaCl (HyperNa)</caption><thead><tr><th scope="col">Preparation</th><th scope="col">≈165 mEq/L</th><th scope="col">≈180 mEq/L</th></tr></thead><tbody><tr><th scope="row">0.9% NaCl · 154 mEq/L</th><td>1,000 mL</td><td>1,000 mL</td></tr><tr><th scope="row">Add 7.2% NaCl · 1232 mEq/L</th><td>10 mL</td><td>25 mL</td></tr><tr><th scope="row">Final volume</th><td>1,010 mL</td><td>1,025 mL</td></tr><tr><th scope="row">Approximate fluid Na</th><td><b>165 mEq/L</b></td><td><b>180 mEq/L</b></td></tr></tbody></table><p class="help quick-reference-math">(1000 × 154 + 10 × 1232) ÷ 1010 ≈ 164.7 mEq/L<br>(1000 × 154 + 25 × 1232) ÷ 1025 ≈ 180.3 mEq/L</p><p class="help"><b>Remember potassium as needed.</b> Add to the unchanged bag; do not remove carrier for these examples. Verify the stock label. Bolus indication, volume and rate remain clinician-selected.</p></section>''').root.children[0])
p.write_text(root.render())
