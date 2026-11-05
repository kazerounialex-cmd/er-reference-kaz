// Link a verified KCl contribution without inferring that a preparation is active.
function phosphateKclSource(record,patient,sharedRate){
 if(record&&record.patient!==patient)return {valid:false,message:'Patient data changed. Revisit KCl to verify its contribution.'};
 if(record?.linked&&record.flow!==sharedRate)return {valid:false,message:'Shared fluid rate changed. Revisit KCl to recalculate its contribution.'};
 if(!record?.valid||!Number.isFinite(record.rate)||record.rate<0)return {valid:false,message:'No valid KCl preparation. Enter a manual rate or revisit KCl.'};
 return {valid:true,rate:record.rate,signature:record.signature};
}
if(typeof module!=='undefined')module.exports={phosphateKclSource};
if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id);if(!$('pKclPanel'))return;
 const key='er-reference-phosphate-kcl-v1',field=$('pKclRate'),effective=$('pOtherK');
 const read=key=>{try{return sessionStorage.getItem(key);}catch{return null;}};
 const generation=()=>read('er-reference-patient-generation-v1')||'';
 const patient=()=>JSON.stringify([$('masterWeight').value,$('masterSpecies').value,read('er-reference-patient-generation-v1')]);
 function defaults(){
  const linked=source();let confirmed=false;
  try{confirmed=JSON.parse(read('er-reference-concurrent-k-v2'))?.included?.kcl===true;}catch{}
  return {generation:generation(),patient:patient(),mode:'auto',value:'',active:linked.valid&&confirmed,signature:linked.valid?linked.signature:null};
 }
 function load(){try{const value=JSON.parse(read(key));if(value?.generation!==generation()||!['auto','manual'].includes(value.mode))return defaults();return {...defaults(),patient:typeof value.patient==='string'?value.patient:patient(),mode:value.mode,value:typeof value.value==='string'?value.value:'',active:value.active===true,signature:typeof value.signature==='string'?value.signature:null};}catch{return defaults();}}
 let state=load(),busy=false,scheduled=false;
 function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
 function source(){
  let record,sharedRate=null;
  try{record=JSON.parse(read('er-reference-concurrent-k-v2'))?.records?.kcl;}catch{}
  try{sharedRate=fluidReferenceResult(JSON.parse(read('er-reference-fluid-v1')),{weight:Number($('masterWeight').value),species:$('masterSpecies').value}).rate;}catch{}
  return phosphateKclSource(record,patient(),sharedRate);
 }
 function apply(){
  if(busy)return;busy=true;
  try{
   if(state.generation!==generation())state=defaults();
   if(state.patient!==patient()){state.patient=patient();state.active=false;}
   const linked=source();let value,message;
   if(state.mode==='auto'){
    if(linked.valid){
     if(state.signature&&state.signature!==linked.signature)state.active=false;
     state.signature=linked.signature;value=linked.rate;ReferenceNumbers.write(field,value);
     message='From KCl calculator · '+value.toFixed(4)+' mEq/kg/hr.';
    }else{field.value='';ReferenceNumbers.forget(field);value=NaN;message=linked.message;}
   }else{
    if(field.value!==state.value)field.value=state.value;
    value=field.value.trim()===''?NaN:Number(field.value);
    message='Manual override · KCl calculator is not linked.';
   }
   $('pKclActive').checked=state.active;
   $('pKclUseCalculator').disabled=!linked.valid||state.mode==='auto';
   const valid=Number.isFinite(value)&&value>=0&&field.checkValidity();
   if(state.active&&!valid)message+=' Confirmed KCl rate is unavailable; preparation results are cleared.';
   else if(!state.active)message+=' Not included until concurrent use is confirmed.';
   else message+=' Included once in total potassium.';
   $('pKclLinkStatus').textContent=message;
   const included=state.active?(valid?value:NaN):0;
   const previous=effective.value.trim()===''?NaN:ReferenceNumbers.read(effective),next=Number.isFinite(included)?included:NaN;
   if(!Object.is(previous,next)){
    if(Number.isFinite(next))ReferenceNumbers.write(effective,next);else{effective.value='';ReferenceNumbers.forget(effective);}
    effective.dispatchEvent(new Event('input',{bubbles:true}));
   }
   save();
  }finally{busy=false;}
 }
 function schedule(){if(scheduled||busy)return;scheduled=true;queueMicrotask(()=>{scheduled=false;apply();});}
 field.addEventListener('input',()=>{state.mode='manual';state.value=field.value;ReferenceNumbers.forget(field);apply();});
 $('pKclActive').addEventListener('change',()=>{
  state.active=$('pKclActive').checked;apply();
  $('includeKcl').checked=state.active;$('includeKcl').dispatchEvent(new Event('change',{bubbles:true}));
 });
 $('includeKcl').addEventListener('change',()=>{state.active=$('includeKcl').checked;apply();});
 $('pKclUseCalculator').addEventListener('click',()=>{state.mode='auto';state.active=false;state.signature=null;apply();});
 for(const name of ['input','change'])document.addEventListener(name,event=>{if(!event.target.closest('#pKclPanel'))schedule();});
 document.querySelectorAll('form').forEach(form=>form.addEventListener('reset',()=>setTimeout(()=>{state={...defaults(),active:false};apply();},0)));
 window.addEventListener('newpatient',()=>{state=defaults();apply();});
 for(const name of ['pageshow','patientrestored'])window.addEventListener(name,()=>{state=load();apply();});
 apply();
})();
