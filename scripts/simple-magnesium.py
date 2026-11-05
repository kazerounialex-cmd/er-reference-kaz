"""Keep magnesium preparation choices primary and supporting context below."""
from pathlib import Path
import runpy
ROOT=Path(__file__).resolve().parents[1]
ns=runpy.run_path(str(ROOT/'scripts/compact-electrolytes.py'));P,N=ns['P'],ns['N']
p=ROOT/'dist/magnesium.html';r=P(p.read_text()).root;main=r.byid('main-content')
chart=r.one(lambda n:n.cls('compact-dose-chart'));chart.attrs['id']='magnesiumDoseOptions'
r.one(lambda n:n.cls('compact-inputs')).attrs['id']='magnesiumPreparation'
context=r.one(lambda n:n.cls('compact-mg-context'))
if context.tag!='details':
 context.tag='details';title=context.one(lambda n:n.tag=='h3');title.tag='summary';title.children=['Optional · total Mg and refractory-potassium context']
 main.add(context,main.children.index(main.one(lambda n:n.tag=='footer')))
for notes in list(chart.all(lambda n:n.cls('compact-dose-notes'))):
 main.add(notes,main.children.index(main.one(lambda n:n.tag=='footer')))
r.one(lambda n:n.tag=='p' and n.cls('intro')).children=['Choose a daily reference, then prepare for the entered duration.']
notice=r.one(lambda n:n.cls('compact-caution'))
notice.children=['Clinician-selected references: usual 1.0 mEq/kg/day; azotemic 0.5 mEq/kg/day. Ionized Mg is often unavailable locally; total Mg alone may not resolve magnesium status. Assess indication, renal function and monitoring.']
notice.add(N('a',[('href','sources.html#magnesium-source')],[' Evidence & limits →']))
notice.remove();main.add(notice,main.children.index(context))
chart.one(lambda n:n.tag=='h2').children=['Choose a daily Mg reference']
chart.one(lambda n:n.tag=='table').one(lambda n:n.tag=='th').children=['Clinical reference']
r.byid('mBand0').children=['Usual reference · iMg unavailable']
r.byid('mBand1').children=['Azotemic patient · lower reference']
for button in chart.all(lambda n:n.tag=='button' and n.attrs.get('data-target')=='mDose'):
 button.children=['Use 1.0' if button.attrs.get('data-value')=='1' else 'Use 0.5']
if not r.all(lambda n:n.attrs.get('id')=='mPrimaryStatus'):
 chart.add(N('p',[('id','mPrimaryStatus'),('class','critical-note'),('role','status'),('hidden',None)]),1)
for notes in main.all(lambda n:n.cls('compact-dose-notes')):
 for paragraph in list(notes.all(lambda n:n.tag=='p')):paragraph.remove()
 notes.add(N('p',children=['Doses are mEq/kg/day, not mg/kg/day. The clinician selected 1.0 as the usual reference and 0.5 for azotemic patients. Amount = daily dose × kg × preparation hours/24: a 12-hour preparation contains half the daily amount. Total Mg context does not automatically select a dose.']))
if not r.all(lambda n:n.attrs.get('id')=='mTimingControls'):
 controls=P('<div id="mTimingControls" class="grid"><label>Run diluted preparation at <span>mL/hr</span><input id="mResultPump" type="number" min=".001" step="any"></label><label>Preparation duration <span>hr</span><input id="mResultHours" type="number" min=".001" step="any"></label></div>').root.children[0]
 section=r.byid('mResultSection');section.add(controls,1)
p.write_text(r.render())
k=ROOT/'dist/potassium.html';root=P(k.read_text()).root
if not root.all(lambda n:n.attrs.get('id')=='kMagnesiumReference'):
 note=P('<p id="kMagnesiumReference" class="k-magnesium-reference">Refractory hypokalemia at KMax? <a href="magnesium.html#magnesiumPreparation">Review magnesium supplementation →</a></p>').root.children[0]
 chart=root.one(lambda n:n.cls('compact-dose-chart'));chart.add(note,1)
root.byid('kMagnesiumReference').children=['If hypokalemia is refractory at KMax (dose-rate limit), consider Mg at 1.0 mEq/kg/day (0.5 if azotemic). ',N('a',[('href','magnesium.html#magnesiumPreparation')],['Mg calculator →'])]
k.write_text(root.render())
sources=ROOT/'dist/sources.html';sr=P(sources.read_text()).root
section=sr.byid('magnesium-source');first=section.one(lambda n:n.tag=='p')
first.children=['The daily quantities 1.0 and 0.5 mEq/kg/day, 4 mEq/mL additive default and optional total-Mg guide originate from Fluids!L13:U20. The clinician-selected current profile uses 1.0 mEq/kg/day usually and 0.5 for azotemic patients, rather than assigning the two doses from total-Mg rows. Ionized Mg is often unavailable locally. Total Mg is not an ionized Mg measurement; use the reporting lab interval if entered. Known high total Mg still blocks these replacement options. The case report below does not validate this entire local profile.']
sources.write_text(sr.render())
