// Optional sample notes. Deliberately independent of reference calculations and fluid state.
(()=>{
 const $=id=>document.getElementById(id);if(!$('sodiumTracker'))return;
 const key='er-reference-sodium-notes-v1',generationKey='er-reference-patient-generation-v1';
 const gen=()=>{try{return sessionStorage.getItem(generationKey)||'';}catch{return '';}};
 let generation=gen(),samples=[];
 const fmt=n=>ReferenceNumbers.display(n);
 function sample(na,stamp,previous,now=Date.now()){
  if(!Number.isFinite(na)||na<=0)throw Error('Enter a positive measured sodium.');
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(stamp))throw Error('Enter the actual sample date and time.');
  const date=new Date(stamp),at=date.getTime(),parts=stamp.split(/[-T:]/).map(Number);
  if(!Number.isFinite(at)||[date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes()].some((n,i)=>n!==parts[i]))throw Error('Enter a valid sample date and time.');
  if(at>now)throw Error('Sample time cannot be in the future.');
  if(previous&&at<=previous.at)throw Error('Sample time must be later than the previous sample.');
  if(previous&&!Number.isFinite((na-previous.na)/((at-previous.at)/3600000)))throw Error('Sample change exceeds numeric limits.');
  return {na,stamp,at};
 }
 function save(){try{sessionStorage.setItem(key,JSON.stringify({generation,samples}));}catch{}}
 function render(){
  const rows=$('naTrackerRows');rows.replaceChildren();
  samples.forEach((s,i)=>{const previous=samples[i-1],delta=previous?s.na-previous.na:null,tr=document.createElement('tr');
   for(const text of [new Date(s.at).toLocaleString(),fmt(s.na),delta===null?'Initial':`${delta<0?'Falling':delta>0?'Rising':'Unchanged'} ${fmt(Math.abs(delta))}`,delta===null?'—':fmt(Math.abs(delta)/((s.at-previous.at)/3600000))]){const td=document.createElement('td');td.textContent=text;tr.append(td);}rows.append(tr);
  });
  const last=samples.at(-1),prev=samples.at(-2);let note=last?`Latest recorded Na ${fmt(last.na)} mEq/L. Total change since initial: ${fmt(last.na-samples[0].na)} mEq/L.`:'No samples recorded. Reference calculations are independent.';
  if(prev){const rate=(last.na-prev.na)/((last.at-prev.at)/3600000);note+=` ${rate<0?'Falling':rate>0?'Rising':'Unchanged'} ${fmt(Math.abs(rate))} mEq/L/hr since previous sample. Math: (${last.na} − ${prev.na}) ÷ ${fmt((last.at-prev.at)/3600000)} hr ≈ ${fmt(rate)} mEq/L/hr.`;if(Math.abs(rate)>.5)note+=' Caution: observed change exceeds the 0.5 mEq/L/hr chronic reference; assess clinical context.';}
  $('naTrackerResult').textContent=note+' This tracker does not establish rolling 24-hour safety.';
 }
 function restore(){
  samples=[];generation=gen();
  try{const stored=JSON.parse(sessionStorage.getItem(key));if(stored?.generation===generation&&Array.isArray(stored.samples))for(const s of stored.samples)samples.push(sample(s.na,s.stamp,samples.at(-1)));}
  catch{samples=[];$('naTrackerError').textContent='Stored sample notes could not be verified; re-enter checked measurements.';}
  render();
 }
 $('naTrackerForm').addEventListener('submit',event=>{
  event.preventDefault();try{
   if($('naSample').value.trim()===''||!$('naSample').checkValidity())throw Error('Enter a positive measured sodium.');
   samples.push(sample(Number($('naSample').value),$('naTime').value,samples.at(-1)));$('naSample').value='';$('naTime').value='';$('naTrackerError').textContent='';save();render();
  }catch(error){$('naTrackerError').textContent='Sample not added: '+error.message;}
 });
 window.addEventListener('newpatient',()=>{samples=[];generation=gen();$('naSample').value='';$('naTime').value='';$('naTrackerError').textContent='';save();render();});
 window.addEventListener('patientrestored',restore);
 window.addEventListener('pageshow',restore);
 restore();
})();
