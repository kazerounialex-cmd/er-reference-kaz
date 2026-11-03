// Timed sodium samples are patient history, independent of interval prescriptions.
(()=>{
 const $=id=>document.getElementById(id);if(!$('sodiumWorkflow'))return;
 const key='er-reference-sodium-v1',generationKey='er-reference-patient-generation-v1';
 const fmt=n=>ReferenceNumbers.display(n),stamp=at=>new Date(at).toLocaleString(),signed=n=>(n>0?'+':'')+fmt(n);
 const generation=()=>{try{return sessionStorage.getItem(generationKey)||'';}catch{return '';}};
 const inputs=['nType','sPerfusion','sNeuro','sInterval','sDecline','sDaily','sLabLow','sLabHigh','sLabSource','nGoal','nHours','sFluid','sCustomName','sFluidNa','sFluidK','sRate'];
 const flags=['sTargetConfirmed','sReconciled'];
 let state={generation:generation(),samples:[],prescriptions:[],values:{},flags:{},targetEdited:false,species:''},currentPlan=null,currentPrescription=null,draftInvalid=false;
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
 function capture(){state.draftInvalid=draftInvalid;state.drafts=Object.fromEntries(['sInitial','sInitialTime','sRepeat','sRepeatTime'].map(id=>[id,$(id).value]));for(const id of inputs)state.values[id]=$(id).value;for(const id of flags)state.flags[id]=$(id).checked;persist();}
 function restore(){
  try{const saved=JSON.parse(sessionStorage.getItem(key));
   if(saved?.generation===generation()&&Array.isArray(saved.samples)&&Array.isArray(saved.prescriptions)){
    // Validate stored history instead of allowing corrupt session data to drive a plan.
    saved.samples.forEach((s,i)=>{const valid=SodiumPlan.sample(s.na,s.stamp,i?saved.samples[i-1]:null);if(valid.at!==s.at)throw Error('Sample timezone changed; review recorded times.');});
    state={...state,...saved};for(const id of ['sInitial','sInitialTime','sRepeat','sRepeatTime'])if(typeof state.drafts?.[id]==='string')$(id).value=state.drafts[id];draftInvalid=state.draftInvalid===true||Boolean($('sRepeat').value||$('sRepeatTime').value);for(const id of inputs)if(typeof state.values?.[id]==='string')$(id).value=state.values[id];for(const id of flags)$(id).checked=state.flags?.[id]===true;
   }
  }catch{$('sSampleError').textContent='Caution: stored sodium history could not be validated. Re-enter verified samples; no stored plan has been applied.';}
 }
 function value(id,label){const f=$(id),invalid=f.value.trim()===''||!f.checkValidity()||!Number.isFinite(Number(f.value));f.setAttribute('aria-invalid',String(invalid));if(invalid)throw Error(`${label}: enter a valid value.`);return Number(f.value);}
 function line(parent,label,text){const row=document.createElement('div');row.className='line';const name=document.createElement('span'),out=document.createElement('b');name.textContent=label;out.textContent=text;row.append(name,out);parent.append(row);}
 function text(id,s){$(id).textContent=s;}
 function invalidate(message){
  currentPlan=null;currentPrescription=null;text('sPlanError',message);text('sNext','— mEq/L');text('sDuration','— hours');text('sAverage','— mEq/L/hr');
  for(const id of ['sNextDetail','sAllowance','sWarnings'])text(id,'');
  $('nWater').replaceChildren();$('nWaterSteps').replaceChildren();line($('nWater'),'Estimate unavailable',message);$('sSavePlan').disabled=true;$('sUseRate').disabled=true;
 }
 function lab(){
  const species=$('masterSpecies').value;
  let valid=false;
  for(const id of ['sLabLow','sLabHigh'])$(id).setAttribute('aria-invalid','false');
  try{if(!$('sLabLow').value&&!$('sLabHigh').value&&!$('sLabSource').value)throw Error('No laboratory interval configured.');const lo=value('sLabLow','Lab lower sodium'),hi=value('sLabHigh','Lab upper sodium');valid=hi>lo&&$('sLabSource').value.trim()!=='';if(valid){text('sLabStatus',`${species||'Select species'} laboratory interval: ${lo}–${hi} mEq/L · ${$('sLabSource').value}. Eventual target remains editable.`);}}
  catch{}
  if(!valid)text('sLabStatus','No laboratory interval configured. Proposed default 158 mEq/L is owner-selected, not a validated upper reference limit. Confirm for this case or enter the laboratory interval/source.');
  return valid;
 }
 function history(){
  const box=$('sHistorySummary'),rows=$('sHistoryRows');box.replaceChildren();rows.replaceChildren();
  if(!state.samples.length){text('sLatest','— mEq/L');return null;}
  const chronic=$('nType').value==='chronic',h=SodiumPlan.history(state.samples,chronic?10:null);text('sLatest',`${fmt(h.latest.na)} mEq/L · ${stamp(h.latest.at)}`);
  line(box,h.direction,h.change===null?'Initial sample':`${signed(h.change)} mEq/L since previous · ${fmt(h.elapsed)} hr elapsed`);
  if(h.hourly!==null)line(box,'Observed change',`${h.direction} · ${fmt(Math.abs(h.hourly))} mEq/L/hr`);
  line(box,'Total since initial',`${signed(h.total)} mEq/L · initial ${fmt(h.initial.na)} mEq/L`);
  line(box,h.complete?'Boundary-bracketed history':'Incomplete 24-hour history',h.complete?`${signed(h.rollingChange)} mEq/L since boundary sample (${stamp(h.anchor.at)}); not an exact 24-hour value.`:'Less than 24 hours of recorded coverage. This is not a complete 24-hour safety assessment.');
  line(box,'Observed declines counted',`${fmt(h.decline)} mEq/L · rises do not replenish allowance; the entire boundary-straddling segment is counted.`);
  if(chronic&&h.hourly!==null&&h.hourly<-.5)line(box,'⚠ Excessive observed decline','Above 0.5 mEq/L/hr for chronic/unknown duration; urgent reassessment.');
  if(h.hourly>0)line(box,'⚠ Rising sodium','Reassess fluids, water balance, losses and the measured response.');
  if(chronic&&h.decline>10)line(box,'⚠ Measured-history ceiling exceeded','Observed declines exceed the approved 10 mEq/L per 24-hour ceiling in the counted window.');
  for(let i=0;i<state.samples.length;i++){
   const s=state.samples[i],prev=state.samples[i-1],tr=document.createElement('tr'),delta=prev?s.na-prev.na:null;
   for(const v of [stamp(s.at),fmt(s.na),prev?`${delta<0?'Falling':delta>0?'Rising':'Unchanged'} ${fmt(Math.abs(delta))} mEq/L`:'Initial',prev?fmt(Math.abs(delta)/((s.at-prev.at)/SodiumPlan.HOUR)):'—']){const td=document.createElement('td');td.textContent=v;tr.append(td);}rows.append(tr);
  }
  const last=state.prescriptions.at(-1);
  if(last&&h.latest.at>last.sampleAt){const observed=h.latest.na-last.current,elapsed=(h.latest.at-last.sampleAt)/SodiumPlan.HOUR;text('sComparison',`Compared with the last recorded plan: observed ${observed<0?'fall':observed>0?'rise':'no change'} ${fmt(Math.abs(observed))} mEq/L over ${fmt(elapsed)} hr; planned decline ${fmt(last.declineRate)} mEq/L/hr toward ${fmt(last.next)} mEq/L at ${stamp(last.due)}. Actual sample timing differs when applicable.`);}
  else text('sComparison','Record a prescription to compare its intended change with a subsequent measured response.');
  return h;
 }
 function signature(){return JSON.stringify({values:Object.fromEntries(inputs.map(id=>[id,$(id).value])),flags:Object.fromEntries(flags.map(id=>[id,$(id).checked])),weight:$('masterWeight').value,species:$('masterSpecies').value,sample:state.samples.at(-1)});}
 const fluidDefaults={d5w:{na:0,k:0,label:'D5W · IV'},enteral:{na:0,k:0,label:'Water · enteral'},lrs:{na:130,k:4,label:'LRS · IV'},balanced:{na:140,k:5,label:'Plasma-Lyte / Normosol-R · IV'},saline:{na:154,k:0,label:'0.9% NaCl · IV'}};
 function preview(h,p){
  const box=$('sPrescriptionPreview');box.replaceChildren();text('sResponseMath','Complete the IV prescription to show the estimate.');currentPrescription=null;$('sSavePlan').disabled=true;
  try{
   if(!p)throw Error('Complete a valid next-interval plan first.');
   const type=$('sFluid').value;if(!type)throw Error('Select the fluid and route.');
   const fluidNa=value('sFluidNa','Fluid sodium'),fluidK=value('sFluidK','Total fluid potassium'),rate=value('sRate','Pump / administration rate');
   const label=type==='custom'?$('sCustomName').value.trim()+' · IV':fluidDefaults[type]?.label;
   if(!label||type==='custom'&&!$('sCustomName').value.trim())throw Error('Enter the custom fluid name.');
   if(!$('sReconciled').checked)throw Error('Confirm the fluid, product values and overlapping deficits.');
   const hours=value('sInterval','Next-check interval'),volume=rate*hours;if(!Number.isFinite(volume))throw Error('Prescribed volume exceeds calculation limits.');
   line(box,'Fluid / route',`${label} · Na ${fmt(fluidNa)} / K ${fmt(fluidK)} mEq/L`);
   line(box,'Prepare','Use the verified product; custom mixtures require separate preparation review.');
   line(box,'Run at · clinician-selected',`${rate} mL/hr · ${fmt(volume)} mL this interval`);
   line(box,'Intended change',`Decline ${fmt(p.decline)} mEq/L toward ${fmt(p.next)} mEq/L`);
   line(box,'Recheck in',`${fmt(hours)} hr · ${stamp(h.latest.at+hours*SodiumPlan.HOUR)} (from latest sample)`);
   let prediction=null;
   let unsafe=p.warnings.some(w=>/duration exceeds|no measured-history/.test(w))||h.hourly<-.5||h.decline>10;
   if(type!=='enteral'){
    const response=sodiumResponse({weight:value('masterWeight','Patient weight'),patientNa:h.latest.na,fluidNa,fluidK,rate,hours});
    prediction={change:response.change,predicted:response.predicted,hourly:response.hourly};
    text('sResponseMath',`Per-liter estimate: (fluid Na ${fluidNa} + total K ${fluidK} − patient Na ${h.latest.na}) ÷ (0.6 × ${$('masterWeight').value} kg + 1). Multiply by planned volume ${fmt(response.volume)} L. Estimated interval change ≈ ${fmt(response.change)} mEq/L. This approximate scaling omits ongoing losses and changing renal handling.`);
    line(box,'Estimated measured response',`${response.change<0?'Falling':response.change>0?'Rising':'Unchanged'} ${fmt(Math.abs(response.change))} mEq/L; estimated end ${fmt(response.predicted)} mEq/L. Not guaranteed.`);
    if(response.change>0){line(box,'⚠ Direction mismatch','This fluid/rate estimates rising sodium; reassess the intended high-sodium plan.');unsafe=true;}
    if(-response.hourly>.5+1e-12||-response.dayChange>10+1e-12||-response.change>h.remaining+1e-12||response.predicted<Number($('nGoal').value)-1e-12){line(box,'⚠ Prescription requires review','Estimated decline exceeds an hourly/daily/history allowance or passes the eventual target.');unsafe=true;}
   }else line(box,'Enteral water','Water-equivalent planning only; no IV sodium-response prediction or shared IV-rate transfer.');
   if(Date.now()>=h.latest.at+hours*SodiumPlan.HOUR){line(box,'⚠ Recheck due / overdue','The latest sample is older than this planning interval. Obtain an updated measurement before recording/transferring a new prescription.');unsafe=true;}
   if($('sPerfusion').value!=='absent'||!$('sNeuro').value||$('sNeuro').value!=='no'){line(box,'⚠ Assessment required','Review impaired/uncertain perfusion or neurologic concern before recording this controlled-correction plan.');unsafe=true;}
   if(unsafe)return;
   currentPrescription={signature:signature(),sampleAt:h.latest.at,current:h.latest.na,next:p.next,declineRate:p.decline/hours,hours,due:h.latest.at+hours*SodiumPlan.HOUR,rate,label,fluidNa,fluidK,type,prediction,volume,at:Date.now()};
   $('sSavePlan').disabled=false;
  }catch(error){line(box,'Not ready',error.message);}
 }
 function render(){
  const h=history(),validLab=lab();
  const acute=$('nType').value==='acute';for(const id of ['sDecline','sDaily'])$(id).disabled=acute;
  $('sCustomName').parentElement.hidden=$('sFluid').value!=='custom';$('sFluidNa').readOnly=$('sFluid').value!=='custom';$('sFluidK').readOnly=$('sFluid').value==='enteral';$('sInitial').readOnly=state.samples.length>0;$('sInitialTime').readOnly=state.samples.length>0;$('sRecordInitial').disabled=state.samples.length>0;
  if(h){$('sInitial').value=String(h.initial.na);$('sInitialTime').value=h.initial.stamp;}
  const perf=$('sPerfusion').value;
  text('sPerfusionStatus',perf==='present'?'⚠ Hypovolemia present: address perfusion with an individualized resuscitation plan. Free water is not a resuscitation bolus.':perf==='uncertain'?'⚠ Perfusion uncertain: assess circulating volume and clinical response. Do not infer a bolus from sodium alone.':perf==='absent'?'Perfusion addressed / hypovolemia absent. Plan controlled correction and recheck the measured response.':'Assess perfusion before prescribing controlled correction.');
  try{
   if(draftInvalid)throw Error('An unrecorded sample is incomplete or invalid. Correct it or clear both repeat-sample fields before using the previous plan.');
   if(!h)throw Error('Record initial sodium with its actual sample time.');
   const species=$('masterSpecies').value;if(!['dog','cat'].includes(species))throw Error('Select the shared species.');
   if(state.species&&state.species!==species)throw Error('Recorded sample species differs from the shared patient. Use New patient for a different patient; restore the original species to review these samples.');
   if(!validLab&&!$('sTargetConfirmed').checked)throw Error('Confirm the eventual target or enter the species laboratory interval and source.');
   if(($('sLabLow').value||$('sLabHigh').value||$('sLabSource').value)&&!validLab)throw Error('Complete a valid laboratory interval and its source, or clear all three laboratory fields.');
   const p=SodiumPlan.plan({weight:value('masterWeight','Patient weight'),current:h.latest.na,eventual:value('nGoal','Eventual sodium target'),hours:value('sInterval','Next-check interval'),rate:value('sDecline','Planned decline'),daily:value('sDaily','24-hour ceiling'),remaining:h.remaining,customHours:$('nHours').value.trim()===''?null:value('nHours','Custom hours'),type:$('nType').value});
   currentPlan=p;text('sPlanError','');text('sNext',`${fmt(p.next)} mEq/L`);text('sDuration',`${fmt(p.duration)} hours${$('nHours').value?' · custom':' · estimated'}`);text('sAverage',`${fmt(p.average)} mEq/L/hr · ${fmt(p.dayChange)} mEq/L in first 24 hr`);
   text('sNextDetail',`From ${fmt(h.latest.na)} to ${fmt(p.next)} mEq/L: planned decline ${fmt(p.decline)} mEq/L over ${fmt(Number($('sInterval').value))} hr. Recheck due ${stamp(h.latest.at+Number($('sInterval').value)*SodiumPlan.HOUR)}.`);
   text('sAllowance',`Conservative measured-history planning allowance: ${fmt(h.remaining)} of 10 mEq/L. ${h.complete?'Boundary-straddling changes are counted conservatively.':'Partial history only; unrecorded correction is unknown. This allowance is a planning bound, not proof of safety.'} No reset at midnight or when recording a new plan.`);
   text('sWarnings',[...p.warnings,...(h.hourly<-.5?['⚠ Latest observed decline exceeds the chronic 0.5 mEq/L/hr reference; reassess urgently.']:[]),...(h.hourly>0?['⚠ Sodium is rising. Reassess the measured response and water balance.']:[]),...(h.decline>10?['⚠ Counted measured declines exceed the 10 mEq/L daily ceiling; reassess urgently.']:[]),...(Date.now()>=h.latest.at+Number($('sInterval').value)*SodiumPlan.HOUR?['⚠ Recheck due / overdue: this sample is older than the selected interval. Update the measurement before recording a prescription.']:[])].join(' '));
   $('nWater').replaceChildren();line($('nWater'),`To eventual target ${fmt(Number($('nGoal').value))} mEq/L`,`${fmt(p.water)} mL free-water deficit (${fmt(p.water/1000)} L)`);line($('nWater'),`To next target ${fmt(p.next)} mEq/L`,`${fmt(p.intervalWater)} mL water-equivalent · not a crystalloid volume`);
   $('nWaterSteps').replaceChildren();for(const t of [`TBW: 0.6 × ${$('masterWeight').value} kg = ${fmt(.6*Number($('masterWeight').value))} L.`,`Eventual free-water deficit: 0.6 × ${$('masterWeight').value} × (${h.latest.na}/${$('nGoal').value} − 1) × 1000 = ${fmt(p.water)} mL.`,`Next-interval water equivalent uses the next target ${p.next} mEq/L, not the eventual target.`,`Estimated duration respects the selected hourly decline, 10 mEq/L daily ceiling and current measured-history allowance. It conservatively holds the remaining allowance across 24 hours; it may overestimate time and must be recalculated with subsequent samples. It is not a guaranteed response or a fluid order.`]){const li=document.createElement('li');li.textContent=t;$('nWaterSteps').append(li);}
  }catch(error){invalidate(error.message);}
  if(acute&&h&&!draftInvalid&&(!$('sLabLow').value&&!$('sLabHigh').value&&!$('sLabSource').value||validLab)&&(validLab||$('sTargetConfirmed').checked)&&state.species===$('masterSpecies').value){
   try{const r=freeWater({weight:value('masterWeight','Patient weight'),current:h.latest.na,target:value('nGoal','Eventual target'),type:'acute',customHours:$('nHours').value.trim()===''?null:value('nHours','Custom hours')});
    text('sDuration',`${fmt(r.hours)} hours · existing acute reference only`);text('sAverage',`${fmt(r.correction)} mEq/L/hr · acute reference estimate`);
    $('nWater').replaceChildren();line($('nWater'),`To eventual target ${fmt(Number($('nGoal').value))} mEq/L`,`${fmt(r.liters*1000)} mL free-water deficit`);line($('nWater'),'Acute reference only','AAHA Table 13A: replacement-time estimate = patient Na − target Na (hours). This is not a complete acute prescription; chronic settings are inactive.');
    const li=document.createElement('li');li.textContent=`0.6 × ${$('masterWeight').value} × (${h.latest.na}/${$('nGoal').value} − 1) = ${fmt(r.liters)} L. Existing acute reference duration: ${fmt(r.hours)} hr.`;$('nWaterSteps').replaceChildren(li);
   }catch(error){text('sPlanError',error.message);}
  }
  preview(h,currentPlan);
  const active=state.prescriptions.at(-1),fresh=active&&active.signature===signature()&&!draftInvalid&&currentPrescription&&Date.now()<active.due;
  text('sActivePlan',active?`${fresh?'Recorded interval prescription':'⚠ Previous prescription · stale / requires reassessment'}: ${active.label} at ${active.rate} mL/hr, intended Na ${fmt(active.next)} mEq/L; recheck ${stamp(active.due)}. ${state.prescriptions.length} prescription(s) retained.`:'No interval prescription recorded.');
  $('sUseRate').disabled=!fresh||active.type==='enteral';
  const print=$('sPrintSummary');print.replaceChildren();const heading=document.createElement('h2');heading.textContent='Hypernatremia · interval review';print.append(heading);
  line(print,'Patient',`${$('masterSpecies').value||'Species required'} · ${$('masterWeight').value||'Weight required'} kg · ${$('nType').value==='acute'?'Confirmed acute':'Chronic / unknown'}`);
  line(print,'Latest recorded sample',h?`${fmt(h.latest.na)} mEq/L · ${stamp(h.latest.at)}`:'Not recorded');
  line(print,'Next-interval suggestion',`${$('sNext').textContent} · check in ${$('sInterval').value||'—'} hr`);
  line(print,'Eventual target',`${$('nGoal').value||'—'} mEq/L · 10 mEq/L per 24-hour ceiling (chronic)`);
  line(print,'Overall duration',`${$('sDuration').textContent} · ${$('sAverage').textContent}`);
  line(print,'Recorded prescription',fresh?`${active.label} · run at ${active.rate} mL/hr · intended Na ${fmt(active.next)} mEq/L · recheck ${stamp(active.due)}.`:'No current recorded prescription. Any previous prescription requires reassessment.');
  if($('sPlanError').textContent||$('sWarnings').textContent)line(print,'⚠ Review',[$('sPlanError').textContent,$('sWarnings').textContent].filter(Boolean).join(' '));
  if(fresh&&active.prediction)line(print,'Recorded response estimate',`${active.prediction.change<0?'Falling':active.prediction.change>0?'Rising':'Unchanged'} ${fmt(Math.abs(active.prediction.change))} mEq/L toward ${fmt(active.prediction.predicted)} mEq/L over ${fmt(active.hours)} hr · estimated, not guaranteed. Intended target and modeled response are distinct.`);
  line(print,'History limitation',h?.complete?'Boundary-bracketed measured history; no exact 24-hour boundary value is inferred.':'Incomplete 24-hour history; this is not a complete daily safety assessment.');
  line(print,'Clinical reference','AAHA 2024 Section 5, Tables 12C/13A. Estimates require serial measured reassessment; not clinical validation.');
 }
 function record(initial){
  const naId=initial?'sInitial':'sRepeat',timeId=initial?'sInitialTime':'sRepeatTime',err=initial?'sSampleError':'sRepeatError';
  try{
   if(initial&&state.samples.length)throw Error('Initial measurement is retained. Add a repeat sample instead.');
   if(!initial&&!state.samples.length)throw Error('Record the initial sample first.');
   const species=$('masterSpecies').value;if(!['dog','cat'].includes(species))throw Error('Select the shared species before recording a sample.');
   if(state.species&&state.species!==species)throw Error('Shared species differs from the recorded patient.');
   const sample=SodiumPlan.sample(value(naId,'Measured sodium'),$(timeId).value,state.samples.at(-1));
   state.samples.push(sample);state.species=species;draftInvalid=false;text(err,'');
   if(!initial){$('sRepeat').value='';$('sRepeatTime').value='';}capture();render();
  }catch(error){draftInvalid=true;text(err,error.message);capture();render();}
 }
 for(const id of ['sAssess','sPlanInputs','sPrescriptionInputs','sRepeatForm'])$(id).addEventListener('submit',event=>event.preventDefault());
 $('sAssess').addEventListener('submit',()=>record(true));$('sRepeatForm').addEventListener('submit',()=>record(false));
 for(const id of inputs.concat(flags)){
  $(id).addEventListener('input',()=>{
   if(id==='nGoal')state.targetEdited=true;
   if(['sLabLow','sLabHigh','sLabSource'].includes(id)&&!state.targetEdited&&$('sLabHigh').value.trim()!=='')$('nGoal').value=$('sLabHigh').value;
   if(id==='sFluid'){
    const f=fluidDefaults[$('sFluid').value];$('sFluidNa').readOnly=$('sFluid').value!=='custom';$('sFluidNa').value=f?String(f.na):'';$('sFluidK').value=f?String(f.k):'';$('sFluidK').readOnly=$('sFluid').value==='enteral';
   }
   if(['sFluid','sFluidNa','sFluidK','sRate','sCustomName'].includes(id))$('sReconciled').checked=false;
   capture();render();
  });
 }
 for(const id of ['sRepeat','sRepeatTime','sInitial','sInitialTime'])$(id).addEventListener('input',()=>{draftInvalid=id.startsWith('sRepeat')?Boolean($('sRepeat').value||$('sRepeatTime').value||$('sRepeat').validity.badInput):!state.samples.length;capture();render();});
 document.querySelectorAll('[data-sodium-hours]').forEach(button=>button.addEventListener('click',()=>{$('sInterval').value=button.dataset.sodiumHours;capture();render();}));
 $('sPrescriptionInputs').addEventListener('submit',()=>{render();if(!currentPrescription)return;state.prescriptions.push({...currentPrescription});capture();render();});
 $('sUseRate').addEventListener('click',()=>{render();if($('sUseRate').disabled)return;const active=state.prescriptions.at(-1);$('sharedFluidRate').value=String(active.rate);$('sharedFluidRate').dispatchEvent(new Event('input',{bubbles:true}));text('sActivePlan',`Transferred recorded IV rate ${active.rate} mL/hr to the shared fluid plan. Verify all concurrent fluids.`);});
 function clearPreparation(all=false){
  // Deliberately retains timed measurements and recorded prescriptions.
  for(const id of inputs){if(!all&&['nType','sPerfusion','sNeuro','sLabLow','sLabHigh','sLabSource','nGoal'].includes(id))continue;const field=$(id);field.value=field.tagName==='SELECT'?(field.options[0]?.value??''):field.defaultValue;}
  for(const id of flags)if(all||id!=='sTargetConfirmed')$(id).checked=false;if(all)state.targetEdited=false;capture();render();
 }
 $('sClearPreparation').addEventListener('click',()=>clearPreparation());
 $('sUseLabTarget').addEventListener('click',()=>{if(!lab()){text('sPlanError','Complete the laboratory lower/upper limits and source first.');return;}$('nGoal').value=$('sLabHigh').value;state.targetEdited=false;capture();render();});
 document.querySelectorAll('[data-path]').forEach(button=>button.addEventListener('click',()=>{
  const hypo=button.dataset.path==='hypo';(hypo?$('hypoWorkflow'):$('sAdvancedMix')).append($('mixingTool'));render();
 }));
 $('masterWeight').addEventListener('input',render);
 $('masterSpecies').addEventListener('change',()=>{
  if(state.values.species!==$('masterSpecies').value){for(const id of ['sLabLow','sLabHigh','sLabSource'])$(id).value='';$('sTargetConfirmed').checked=false;state.targetEdited=false;$('nGoal').value='158';state.values.species=$('masterSpecies').value;capture();}render();
 });
 function newPatient(){
  state={generation:generation(),samples:[],prescriptions:[],values:{},flags:{},targetEdited:false,species:''};draftInvalid=false;
  for(const id of ['sInitial','sInitialTime','sRepeat','sRepeatTime'])$(id).value='';for(const id of ['sSampleError','sRepeatError','sComparison'])text(id,'');clearPreparation(true);
 }
 window.addEventListener('newpatient',newPatient);
 window.addEventListener('patientrestored',()=>{if(state.generation!==generation())newPatient();else render();});
 window.addEventListener('pageshow',()=>{if(state.generation!==generation())newPatient();else render();});
 for(const id of ['sInterval','sDecline','sDaily','nGoal','nHours'])$(id).setAttribute('aria-describedby','sPlanError');
 for(const id of ['sFluid','sCustomName','sFluidNa','sFluidK','sRate'])$(id).setAttribute('aria-describedby','sPrescriptionPreview');
 restore();render();
 // No arbitrary stale-data threshold: mark due plans using their own recheck time.
 setInterval(render,30000);
})();
