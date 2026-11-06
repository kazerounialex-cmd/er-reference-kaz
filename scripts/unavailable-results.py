"""Keep short, accessible reasons next to disabled choices after generation."""
from pathlib import Path
import runpy
ROOT=Path(__file__).resolve().parents[1]
ns=runpy.run_path(str(ROOT/'scripts/compact-electrolytes.py'));P,N=ns['P'],ns['N']
for name in ['magnesium','phosphate','dextrose','cri-insulin']:
 p=ROOT/'dist'/f'{name}.html';r=P(p.read_text()).root
 for i,button in enumerate(r.all(lambda n:n.tag=='button' and (n.cls('lyte-rate') or 'data-insulin'in n.attrs))):
  reason=f'{name}Unavailable{i}'
  button.attrs['data-unavailable-reason']=reason
  button.attrs['aria-describedby']=' '.join(dict.fromkeys((button.attrs.get('aria-describedby','')+' '+reason).split()))
  if not r.all(lambda n:n.attrs.get('id')==reason):button.parent.add(N('small',[('id',reason),('class','unavailable-note'),('hidden',None)]),button.parent.children.index(button)+1)
 if name=='phosphate' and not r.all(lambda n:n.attrs.get('id')=='pOverrideK'):
  panel=r.byid('pKclTotalBox')
  panel.add(P('<label class="phosphate-limit-override"><input id="pOverrideK" type="checkbox" aria-describedby="pOverrideStatus"> Clinician override · allow total K above 0.5 mEq/kg/hr</label><p id="pOverrideStatus" class="unavailable-note" role="status">Off by default. Patient, fluid and K-source changes clear it.</p>').root.children[0])
  # Parser roots can contain multiple siblings; add the status separately.
  panel.add(N('p',[('id','pOverrideStatus'),('class','unavailable-note'),('role','status')],['Off by default. Patient, fluid and K-source changes clear it.']))
 if name=='phosphate' and not r.all(lambda n:n.attrs.get('id')=='pResultUnavailable'):
  panel=r.byid('pKclTotalBox');panel.add(N('small',[('id','pResultUnavailable'),('class','unavailable-note'),('hidden',None)]),panel.children.index(r.byid('pKclTotal'))+1)
 p.write_text(r.render())
sources=ROOT/'dist/sources.html';r=P(sources.read_text()).root
if not r.all(lambda n:n.attrs.get('id')=='phosphateOverrideSource'):
 r.byid('phosphate-source').add(N('p',[('id','phosphateOverrideSource')],['Clinician-requested exception: the standalone phosphate page can explicitly override the combined 0.5 mEq/kg/hr potassium block. The limit remains visible, with nominal and displayed total-K warnings. This does not establish safety above the reference limit. Invalid inputs and physically impossible mixtures cannot be overridden. The override is not retained across navigation or changes to patient, fluid settings, additive concentrations or additional K.']))
sources.write_text(r.render())

p=ROOT/'dist/blood-collection.html';r=P(p.read_text()).root
for id in ['bPrint','bDownload','bCSV']:r.byid(id).attrs['aria-describedby']='bExportStatus'
p.write_text(r.render())
