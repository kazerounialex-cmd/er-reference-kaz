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
for option in root.byid('nDailyLimit').all(lambda n:n.tag=='option'):
 option.attrs.pop('selected',None)
 option.children=[option.attrs['value']+(' (default)' if option.attrs['value']=='12' else '')]
 if option.attrs['value']=='12':option.attrs['selected']=None
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
 top.add(N('section',[('class','panel'),('id','sodiumQuickReference'),('aria-label','Rough bolus-fluid preparation reference')]))
# Correction time is the main free-water result; D5W quantities are secondary.
h['heading'](root.byid('nGoal').parent.parent,'Free water deficit')
h['heading'](root.byid('nWaterSection'),'Free water deficit')
# Regenerate the concise add-on table from this source on each pass.
quick=root.byid('sodiumQuickReference');quick.children=[]
fragment=P('''<h2>Bolus-fluid preparation · rough reference</h2><form data-electrolyte><label>Base fluid remaining · mL<input id="nBolusVolume" type="number" min="0.001" step="any" value="1000" required aria-describedby="nBolusError"></label></form><table><caption>7.2% NaCl (1232 mEq/L) to ADD · no carrier removal</caption><thead><tr><th scope="col">Base fluid · Na mEq/L</th><th scope="col">≈165 mEq/L</th><th scope="col">≈180 mEq/L</th></tr></thead><tbody><tr><th scope="row">0.9% NaCl · 154</th><td id="nBolus00">10 mL</td><td id="nBolus01">25 mL</td></tr><tr><th scope="row">Plasma-Lyte / Normosol-R · 140</th><td id="nBolus10">23.4 mL</td><td id="nBolus11">38.0 mL</td></tr><tr><th scope="row">LRS · 130</th><td id="nBolus20">32.8 mL</td><td id="nBolus21">47.5 mL</td></tr></tbody></table><p id="nBolusError" class="critical-note" role="status"></p><p class="help"><b>Remember potassium as needed.</b> Use the actual base volume remaining if the bag has already started. Verify the 7.2% stock label. Bolus indication, patient volume and rate remain clinician-selected.</p><div id="nBolusMath" class="quick-reference-math" aria-live="polite"></div>''').root
for child in list(fragment.children):quick.add(child)
if not root.all(lambda n:n.attrs.get('id')=='nBagRate'):
 grid=root.byid('nVolume').parent.parent
 grid.add(P('''<div class="sodium-bag-rate"><label>Bag rate · mL/hr<input id="nBagRate" type="number" min="0.001" step="any" aria-describedby="nBagRateLinkStatus"></label><small id="nBagRateLinkStatus"></small><button type="button" id="nBagRateUseShared">Use shared rate</button></div>''').root.children[0])
 summary=P('''<section class="sodium-bag-summary" id="nBagSection"><h3>Bag time & planned sodium</h3><div id="nBag" aria-live="polite"></div><section id="nBagMath" class="worked-math"><h3>Bag math · 0.5 mEq/L/hr reference</h3><ol id="nBagSteps"></ol></section></section>''').root.children[0]
 grid.parent.add(summary,grid.parent.children.index(grid)+1)
root.byid('nBagMath').one(lambda n:n.tag=='h3').children=['Bag math']
# Two rows: compact inputs/time above; fluid choices beside the selected recipe below.
if not root.all(lambda n:n.cls('sodium-preparation-row')):
 form=root.byid('nVolume').parent.parent.parent
 cards=root.byid('mixingTool').one(lambda n:n.cls('fluid-card-grid'))
 pos=form.children.index(cards);cards.remove();selected=root.byid('nMixSection');selected.remove()
 row=N('div',[('class','sodium-preparation-row')]);row.add(cards);row.add(selected);form.add(row,pos)
 math=root.byid('nMixMath');math.remove();bagmath=root.byid('nBagMath');bagmath.remove()
 shared=N('section',[('id','nSharedFluidMath'),('class','sodium-shared-math worked-math')])
 shared.add(N('h3',children=['Preparation math · all base fluids']))
 shared.add(P('''<p>For a specified final volume: <b>stock mL = final mL × (target fluid Na − base Na) ÷ (stock Na − base Na)</b>. Remove that much carrier and replace it with stock. Carrier mL = final mL − stock mL. Verify fluid Na = (stock mL × stock Na + carrier mL × base Na) ÷ final mL. If base and stock already equal the target, use carrier only.</p>''').root.children[0])
 math.one(lambda n:n.tag=='h3').children=['Selected fluid · substituted example'];shared.add(math);shared.add(bagmath);form.add(shared)
# Stable anchors for every main section, including optional disclosures.
root.one(lambda n:n.cls('simple-sodium-top')).attrs['id']='sodiumPatientTop'
for id,anchor in [('nGlucoseSection','sodiumGlucose'),('nQuickSection','sodiumQuickMath')]:
 node=root.byid(id)
 while node.tag!='details':node=node.parent
 node.attrs['id']=anchor
root.one(lambda n:n.cls('sodium-reference-source')).attrs['id']='sodiumSources'
for old in list(root.all(lambda n:n.attrs.get('id')=='sodiumSectionLinks')):old.remove()
links=[('sodiumPatientTop','Patient / bolus'),('hyperWorkflow','Free water deficit'),('mixingTool','Fluid preparation'),('nSharedFluidMath','Preparation math'),('sodiumGlucose','Glucose correction'),('sodiumQuickMath','Mixing quick math'),('sodiumGuidance','Guidance / response'),('sodiumTracker','Tracker'),('sodiumSources','Sources')]
menu=N('div',[('id','sodiumSectionLinks'),('class','sodium-section-links'),('role','group'),('aria-label','Sodium sections')])
for anchor,label in links:menu.add(N('a',[('href','#'+anchor),('data-sodium-jump',None)],children=[label]))
sodium=root.one(lambda n:n.tag=='a' and n.attrs.get('href')=='sodium.html' and n.attrs.get('aria-current')=='page')
sodium.parent.add(menu,sodium.parent.children.index(sodium)+1)
p.write_text(root.render())
