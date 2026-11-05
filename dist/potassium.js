const referenceScrollBehavior=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth';
// Form and chart behavior. The arithmetic remains in calc.js.
const get=id=>document.getElementById(id);
const kFormat=n=>ReferenceNumbers.display(n);
const kVolume=n=>ReferenceNumbers.volume(n);
const bands=[[.5],[.3,.4],[.2,.25],[.1,.15],[.05]];
const outputIds=['kAdd','kDiluent','kFinalVolume','kAddedMEq','kConcentration','kConcentrationL','kHours','kDelivered'];
function readBase(){
 const fields=['kWeight','kRate','kVolume','kStock','kOther'];
 if(fields.some(id=>get(id).value.trim()==='' || !get(id).checkValidity()))throw Error('Enter valid weight, fluid rate, volume, additive concentration, and separate K rate.');
 return {weight:Number(get('kWeight').value),fluidRate:typeof FluidReferenceNumbers==='undefined'?Number(get('kRate').value):FluidReferenceNumbers.value(get('kRate')),volume:Number(get('kVolume').value),stock:Number(get('kStock').value),otherK:Number(get('kOther').value),method:get('kMethod').value};
}
function potassiumRoundingMessage(prepared,blocked=false){
 let note=`${blocked?'Unavailable':'Rounding warning'}: ${prepared.delivered.toFixed(4)} mEq/kg/hr.`;
 if(blocked)note+=' Above 0.5010.';
 if(prepared.roundDown)note+=` Reduce additive to ${kVolume(prepared.roundDown.drug)} mL → ${prepared.roundDown.delivered.toFixed(4)} mEq/kg/hr.`;
 else note+=' Review additive volume.';
 return note;
}
function renderChart(base){
 let available=0;
 bands.forEach((rates,i)=>{
  const reasons=[];
  const values=rates.map((target,j)=>{try{
   const p={...base,target},result=calculatePotassium(p),verified=PreparationCheck.potassium(p,result);
   if(verified.deliveryWarning)reasons[j]=potassiumRoundingMessage(verified);
   return result;
  }catch(error){
   let reason=error.message;
   if(error.code==='POTASSIUM_DISPLAY_LIMIT'){
    reason=potassiumRoundingMessage(error.preparation,true);
   }
   reasons[j]=base?(error.code==='POTASSIUM_DISPLAY_LIMIT'?reason:'Unavailable — '+reason):'';
   return null;
  }});
  get('kEq'+i).textContent=values.map(v=>v?ReferenceNumbers.display(v.addedMEq)+' mEq':'—').join(' – ');
  get('kMl'+i).textContent=values.map(v=>v?kVolume(v.additive)+' mL':'— mL').join(' – ');
  document.querySelectorAll(`[data-row="${i}"]`).forEach((button,j)=>{
   button.disabled=!values[j];
   const reason=get(`kRateReason${i}_${j}`);
   if(reason){reason.textContent=reasons[j]||'';reason.hidden=!reasons[j];}
   button.setAttribute('title',reasons[j]||'');
   const selected=get('kTarget').value!=='' && Number(get('kTarget').value)===rates[j];
   button.setAttribute('aria-pressed',String(selected));
   if(values[j])available++;
  });
 });
 get('kChartStatus').textContent=!base?'Enter weight, fluid rate, and preparation volume to fill the chart.':available===8?'Calculated from the current inputs. Choose a rate to see its math.':'Some rates are unavailable (—). The explanation is shown beside each disabled option.';
}
function updatePeripheralWarning(concentration=null){
 const box=get('kPeripheralWarning');
 if(!box)return;
 const valid=Number.isFinite(concentration),near=valid&&concentration>=0.2-1e-12;
 box.hidden=!near;
 get('kConcentration').setAttribute('data-monitor',String(near));
 get('kPeripheralHeading').textContent='';get('kPeripheralMessage').textContent='';
 if(!near){box.setAttribute('data-level','');return;}
 const above=concentration>0.2+1e-12;
 box.setAttribute('data-level',above?'above':'near');
 get('kPeripheralHeading').textContent=above?'Above peripheral KCl limit':'At peripheral KCl limit';
 const current=ReferenceNumbers.display(concentration);
 get('kPeripheralMessage').textContent=`Current: ${current} mEq/mL · Clinician-selected peripheral limit: 0.2 mEq/mL. Monitor the catheter site for pain, redness, swelling or phlebitis; reassess the catheter and vascular access if irritation develops.`;
}
function clearSelected(message){
 updatePeripheralWarning();
 if(get('kPump'))get('kPump').textContent='—';
 outputIds.forEach(id=>get(id).textContent='—');get('kStatus').textContent=message;
 get('kMathSteps').replaceChildren();get('kMath').open=false;
}
function showMath(p,r){
 const net=p.target-p.otherK;
 const c=net*p.weight/p.fluidRate;
 const steps=[
  `Prescribed calculation before display rounding · KCl rate needed: ${p.target} − ${p.otherK} = ${kFormat(net)} mEq/kg/hr.`,
  `KCl delivery: ${kFormat(net)} × ${p.weight} kg = ${kFormat(net*p.weight)} mEq/hr.`,
  `Required added-K concentration: ${kFormat(net*p.weight)} mEq/hr ÷ ${ReferenceNumbers.display(p.fluidRate)} mL/hr = ${kFormat(c,6)} mEq/mL.`,
  p.method==='final'?`KCl additive volume: ${p.volume} mL × ${kFormat(c,6)} mEq/mL ÷ ${p.stock} mEq/mL = ${kVolume(r.additive)} mL.`:`KCl additive volume: (${p.volume} mL × ${kFormat(c,6)} mEq/mL) ÷ (${p.stock} − ${kFormat(c,6)}) mEq/mL = ${kVolume(r.additive)} mL.`,
  `Preparation: ${kVolume(r.diluent)} mL carrier + ${kVolume(r.additive)} mL KCl = ${kVolume(r.finalVolume)} mL final.`,
  `KCl in bag: ${kVolume(r.additive)} mL × ${p.stock} mEq/mL = ${ReferenceNumbers.display(r.addedMEq)} mEq.`,
  `Displayed preparation verification: (${ReferenceNumbers.display(r.addedMEq)} mEq ÷ ${kVolume(r.finalVolume)} mL) × ${ReferenceNumbers.display(p.fluidRate)} mL/hr ÷ ${p.weight} kg + ${p.otherK} mEq/kg/hr = ${r.delivered.toFixed(4)} mEq/kg/hr.`
 ];
 get('kMathSteps').replaceChildren(...steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
function updatePotassium(){
 // Both custom controls edit one selected rate; avoid rewriting the active input.
 const bottom=get('kTargetBottom');
 if(bottom&&bottom.value!==get('kTarget').value)bottom.value=get('kTarget').value;
 const method=get('kMethod').value;
 get('kSettingsLabel').textContent=method==='final'?'Preparation settings · final prepared volume':'Preparation settings · starting carrier volume';
 get('kMethodHelp').textContent=method==='final'?'Volume means the final total: remove the calculated KCl volume from measured carrier, then replace with KCl.':'Volume means the measured starting carrier: added KCl increases the final total.';
 get('kStockDisplay').textContent=get('kStock').value || '—';
 let base;
 try{base=readBase();}catch{renderChart(null);clearSelected('Complete the patient and fluid inputs, then choose a rate.');return;}
 renderChart(base);
 if(get('kTarget').value.trim()==='' || !get('kTarget').checkValidity()){clearSelected('Choose a rate from the chart, or enter a custom rate from 0–0.5 mEq/kg/hr.');return;}
 try{
  const p={...base,target:Number(get('kTarget').value)};
  const r=calculatePotassium(p);
  const verified=PreparationCheck.potassium(p,r);
  updatePeripheralWarning(r.finalConcentration/1000);
  if(get('kPump'))get('kPump').textContent=ReferenceNumbers.display(p.fluidRate)+' mL/hr';
  get('kAdd').textContent=kVolume(r.additive);
  for(const [id,value,unit] of [['kDiluent',verified.diluent,'mL'],['kFinalVolume',verified.volume,'mL'],['kAddedMEq',verified.amount,'mEq'],['kConcentration',verified.concentration,'mEq/mL'],['kHours',verified.hours,'hr'],['kDelivered',verified.delivered,'mEq/kg/hr']])get(id).textContent=(unit==='mEq/kg/hr'?value.toFixed(4):unit==='mEq/mL'?ReferenceNumbers.display(value):(unit==='mL'?kVolume(value):['mEq/kg/hr','mEq'].includes(unit)?ReferenceNumbers.display(value):kFormat(value,3)))+' '+unit;
  get('kConcentrationL').textContent=ReferenceNumbers.display(verified.concentration*1000)+' mEq/L';
  get('kStatus').textContent=method==='final'?`Selected ${p.target} mEq/kg/hr. Remove ${kVolume(r.additive)} mL carrier and replace with the same volume of KCl additive.`:`Selected ${p.target} mEq/kg/hr. Add ${kVolume(r.additive)} mL KCl additive to the measured starting carrier volume.`;
  if(verified.deliveryWarning)get('kStatus').textContent+=' '+potassiumRoundingMessage(verified);
  get('kStatus').textContent+=' Check measurement feasibility, especially for very small additive volumes; verify equipment precision and use a clinician-approved dilution if needed. No dilution recipe is assumed.';
  if(verified.note)get('kStatus').textContent+=' '+verified.note;
  showMath(p,{...r,diluent:verified.diluent,finalVolume:verified.volume,addedMEq:verified.amount,delivered:verified.delivered,displayPump:verified.pump});
 }catch(e){clearSelected('Invalid: '+e.message);}
}
function toggleStock(){
 const input=get('kStock');
 if(input.readOnly){
  input.readOnly=false;get('kStockEditor').hidden=false;
  get('kStockToggle').textContent='Lock concentration';get('kStockToggle').setAttribute('aria-expanded','true');
  get('kLockState').textContent='Editing — verify vial';input.focus();
 }else{
  if(input.value.trim()==='' || !Number.isFinite(Number(input.value)) || Number(input.value)<=0 || !input.checkValidity()){get('kStockHelp').textContent='Enter a positive additive concentration before locking.';input.focus();return;}
  input.readOnly=true;get('kStockEditor').hidden=true;
  get('kStockToggle').textContent='Edit concentration';get('kStockToggle').setAttribute('aria-expanded','false');get('kLockState').textContent='Locked';
 }
 updatePotassium();
}
function selectRate(button){
 get('kTarget').value=button.dataset.rate;
 updatePotassium();
 if(typeof ReferenceLayout!=='undefined'){ReferenceLayout.reveal('kResults','kMath');return;}
 get('kMath').open=true;
 get('kResults').scrollIntoView({behavior:referenceScrollBehavior,block:'start'});get('kResults').focus({preventScroll:true});
}
get('kStockToggle').addEventListener('click',toggleStock);
get('potassiumForm').addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('.rate-pick').forEach(button=>button.addEventListener('click',()=>selectRate(button)));
// The shared weight field lives outside the compact form.
get('kWeight').addEventListener('input',updatePotassium);
get('potassiumForm').addEventListener('input',event=>{
 if(event?.target?.id==='kTargetBottom')get('kTarget').value=event.target.value;
 updatePotassium();
});
get('potassiumForm').addEventListener('reset',()=>setTimeout(()=>{
 get('kStock').readOnly=true;get('kStockEditor').hidden=true;get('kStockToggle').textContent='Edit concentration';get('kStockToggle').setAttribute('aria-expanded','false');get('kLockState').textContent='Locked';updatePotassium();
},0));
updatePotassium();
