"""Idempotent presentation controls shared by generated pages."""
from pathlib import Path
import runpy
ns=runpy.run_path(str(Path(__file__).with_name('compact-electrolytes.py')))
P,N=ns['P'],ns['N']
ids=set('kVolume mVolume pVolume dVolume nVolume qVolumeA qVolumeB fentVolume fentCapacity prepVolume prepCapacity insCapacity syringeVolume bagVolume r12Capacity r6Capacity rBagVolume os-kVolume os-naVolume os-phosVolume os-dextroseVolume os-hypoVolume'.split())
for path in (Path(__file__).resolve().parents[1]/'dist').glob('*.html'):
 root=P(path.read_text()).root
 if path.name=='magnesium.html' and not root.all(lambda n:n.attrs.get('id')=='mPump'):
  hours=root.byid('mHours');grid=hours.parent.parent
  grid.add(N('label',children=['Diluted preparation pump rate ',N('span',children=['mL/hr']),N('input',[('id','mPump'),('type','number'),('min','.001'),('step','any'),('required',None)])]))
  grid.add(N('p',[('class','help magnesium-link-note')],['Linked: pump rate = final volume ÷ duration. Edit rate or duration; the other updates. This is the complete diluted infusion, not the MgSO₄ stock rate.']))
 if path.name=='potassium.html':
  if not root.all(lambda n:n.cls('k-preparation-grid')):
   rate=root.byid('kRate').parent;grid=rate.parent;grid.addcls('k-preparation-grid')
   volume=root.byid('kVolume').parent
   stack=grid.add(N('div',[('class','k-volume-stock')]))
   stack.add(volume)
   stack.add(root.one(lambda n:n.cls('stock-bar')))
   stack.add(root.byid('kStockEditor'))
   custom=root.byid('kTarget').parent
   chart=custom.parent;position=chart.children.index(custom)
   note=next(n for n in chart.children[position+1:] if isinstance(n,N) and n.tag=='p')
   box=grid.add(N('div',[('class','k-custom-panel')]))
   box.add(custom);box.add(note);note.attrs['id']='kCustomHelp'
   custom.children[0]='Selected / custom rate '
   root.byid('kTarget').attrs['placeholder']='Enter 0–0.5'
   root.byid('kTarget').attrs['aria-describedby']='kCustomHelp'
  if not root.all(lambda n:n.attrs.get('id')=='kTargetBottom'):
   chart=root.one(lambda n:n.cls('compact-dose-chart'))
   bottom=chart.add(N('div',[('class','k-custom-panel k-custom-bottom')]))
   label=bottom.add(N('label',[('class','custom-target')],['Selected / custom rate ',N('span',children=['mEq/kg/hr'])]))
   label.add(N('input',[('id','kTargetBottom'),('type','number'),('min','0'),('max','0.5'),('step','any'),('required',None),('placeholder','Enter 0–0.5'),('aria-describedby','kCustomBottomHelp')]))
   bottom.add(N('p',[('class','help'),('id','kCustomBottomHelp')],['Same selected rate as the control above. Editing either updates this preparation.']))
  for b in root.all(lambda n:n.cls('rate-pick')):
   if not b.all(lambda n:n.cls('rate-unit')):b.add(N('small',[('class','rate-unit')],['mEq/kg/hr']))
  for row in range(5):
   for j,b in enumerate(root.all(lambda n:n.tag=='button' and n.attrs.get('data-row')==str(row))):
    reason_id=f'kRateReason{row}_{j}'
    b.attrs['aria-describedby']=reason_id
    if root.all(lambda n:n.attrs.get('id')==reason_id):continue
    parent=b.parent;position=parent.children.index(b)
    option=parent.add(N('div',[('class','k-rate-option')]),position);option.add(b)
    option.add(N('small',[('id',reason_id),('class','k-rate-unavailable'),('hidden',None)]))
 for field in root.all(lambda n:n.tag=='input' and n.attrs.get('id') in ids and n.attrs.get('type')=='number'):
  id=field.attrs['id']
  if root.all(lambda n:n.attrs.get('data-volume-for')==id):continue
  group=N('span',[('class','volume-presets'),('role','group'),('aria-label','Quick volumes in mL'),('data-volume-for',id)])
  for v in [12,250,500,1000]:group.add(N('button',[('type','button'),('data-volume-target',id),('data-volume-value',str(v)),('aria-label',f'Set volume to {v} mL')],[f'{v}']))
  group.add(N('small',children=['mL']))
  field.parent.add(group,field.parent.children.index(field)+1)
 if not root.all(lambda n:n.tag=='script' and n.attrs.get('src')=='volume-presets.js'):
  body=root.one(lambda n:n.tag=='body');body.add(N('script',[('src','volume-presets.js')]))
 path.write_text(root.render())
