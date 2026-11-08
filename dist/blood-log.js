// Local, patient-generation-scoped draw entries. No server storage.
const BloodDrawLog=(()=>{
 const $=id=>document.getElementById(id),keys=['date','time','volume','site','reason','initials'];
 const identity=['bPatient','bRecord','bStart','bClinician'],planFields=['bContext','bVolumePerKg','bReduction','bDayPercent','bFortnightPercent','bApprovedDay','bApprovedFortnight'],storageKey='er-reference-blood-draw-log-v1';
 const generation=()=>{try{return sessionStorage.getItem('er-reference-patient-generation-v1')||'';}catch{return '';}};
 const empty=()=>Array.from({length:16},()=>Object.fromEntries(keys.map(k=>[k,''])));
 let entries=empty(),savedIdentity={},savedPlan={},savedGeneration=generation(),storageError='';
 function planValues(){return Object.fromEntries(planFields.map(id=>[id,$(id).value]));}
 function restorePlan(){for(const id of planFields)if(typeof savedPlan[id]==='string')$(id).value=savedPlan[id];}
 function identityValues(){return Object.fromEntries(identity.map(id=>[id,$(id).value]));}
 function restoreIdentity(values){for(const id of identity){if(id==='bStart'&&!values?.[id])continue;$(id).value=typeof values?.[id]==='string'?values[id]:'';}}
 try{const saved=JSON.parse(sessionStorage.getItem(storageKey));if(saved?.generation===savedGeneration){entries=bloodDrawLog(saved.entries).rows.map(row=>Object.fromEntries(keys.map(k=>[k,row[k]])));savedIdentity=saved.identity&&typeof saved.identity==='object'?saved.identity:{};restoreIdentity(savedIdentity);savedPlan=saved.plan&&typeof saved.plan==='object'?saved.plan:{};restorePlan();}}catch{storageError='Saved log could not be restored. Re-enter checked draw records.';}
 function save(){try{sessionStorage.setItem(storageKey,JSON.stringify({generation:savedGeneration,entries,identity:savedIdentity,plan:savedPlan}));storageError='';}catch{storageError='This tab cannot save the log. Keep the page open and print or export a copy.';}if($('bDrawStorage'))$('bDrawStorage').textContent=storageError;}
 function syncGeneration(){if(savedGeneration===generation())return false;savedGeneration=generation();entries=empty();savedIdentity={};savedPlan={};for(const id of identity)$(id).value='';save();return true;}
 function refresh(){
  const log=bloodDrawLog(entries);
  for(let i=0;i<16;i++){
   const row=log.rows[i],total=$('bDrawTotal'+i),error=$('bDrawError'+i),volume=$('bDrawVolume'+i);
   total.textContent=row.running===null?'—':bloodLogFormat(row.running)+' mL';error.textContent=row.error;error.hidden=!row.error;volume.setAttribute('aria-invalid',String(!!row.error));
  }
  $('bDrawStatus').textContent=!log.valid?'Sheet total unavailable: complete the flagged draw volumes.':log.hasEntries?'Sheet total: '+bloodLogFormat(log.total)+' mL · entered rows only. Rolling totals require reconciliation.':'No draws entered. Unused rows will print blank for handwriting.';
  $('bDrawStorage').textContent=storageError;
  if(typeof updateBlood==='function')updateBlood();
 }
 function render(){
  $('bDrawRows').replaceChildren(...entries.map((row,i)=>{
   const tr=document.createElement('tr');
   for(const [key,type,label] of [['date','date','Date'],['time','time','Time'],['volume','number','Blood removed (mL)'],['running','output','Sheet running total'],['site','text','Draw site'],['reason','text','Test / reason'],['initials','text','Initials']]){
    const td=document.createElement('td');tr.append(td);
    if(type==='output'){const out=document.createElement('output');out.id='bDrawTotal'+i;out.setAttribute('aria-label','Row '+(i+1)+' sheet total (mL)');td.append(out);continue;}
    const input=document.createElement('input');input.type=type;input.id=key==='volume'?'bDrawVolume'+i:'bDraw'+key+i;input.dataset.row=i;input.dataset.field=key;input.value=row[key];input.setAttribute('aria-label','Row '+(i+1)+': '+label);
    if(type==='number'){input.min='0';input.step='any';input.setAttribute('aria-describedby','bDrawError'+i);}else if(type==='text')input.maxLength={site:40,reason:80,initials:12}[key];
    td.append(input);
    if(key==='volume'){const error=document.createElement('small');error.id='bDrawError'+i;error.className='unavailable-note';error.hidden=true;td.append(error);}
   }
   const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='Clear';button.setAttribute('aria-label','Clear draw row '+(i+1));button.addEventListener('click',()=>{entries[i]=Object.fromEntries(keys.map(k=>[k,'']));save();render();$('bDrawdate'+i).focus();});td.append(button);tr.append(td);return tr;
  }));refresh();
 }
 $('bloodDrawForm').addEventListener('submit',event=>event.preventDefault());
 $('bloodDrawForm').addEventListener('input',event=>{
  const field=event.target;if(!keys.includes(field.dataset.field))return;
  if(syncGeneration()){render();return;}
  savedIdentity=identityValues();savedPlan=planValues();entries[Number(field.dataset.row)][field.dataset.field]=field.type==='number'&&field.validity.badInput?'Invalid number':field.value;save();refresh();
 });
 // Shared patient resets also reset forms. Restore model values unless this is a new patient.
 $('bloodDrawForm').addEventListener('reset',()=>setTimeout(()=>{syncGeneration();render();},0));
 $('bloodForm').addEventListener('input',()=>{if(syncGeneration()){render();return;}savedIdentity=identityValues();savedPlan=planValues();save();});
 $('bloodForm').addEventListener('reset',()=>setTimeout(()=>{syncGeneration();restoreIdentity(savedIdentity);savedPlan=planValues();save();refresh();},0));
 for(const name of ['pageshow','patientrestored','newpatient'])window.addEventListener(name,()=>{syncGeneration();restoreIdentity(savedIdentity);restorePlan();render();});
 render();
 return {entries:()=>entries.map(row=>({...row})),result:()=>bloodDrawLog(entries)};
})();
