// Recorded observations only: these totals do not determine sampling allowances.
function bloodDrawLog(entries=[]){
 if(!Array.isArray(entries)||entries.length>16)throw Error('Use up to 16 draw rows per sheet.');
 let sum=0,complete=true,hasEntries=false;const errors=[];
 const rows=Array.from({length:16},(_,i)=>{
  const entry=entries[i]||{},row={};
  for(const [key,max]of Object.entries({date:10,time:5,volume:100,site:40,reason:80,initials:12}))row[key]=String(entry[key]??'').slice(0,max);
  const used=Object.values(row).some(v=>v.trim()!=='');hasEntries||=used;
  let error='';const raw=row.volume.trim(),volume=raw===''?null:Number(raw);
  if(used&&(volume===null||!Number.isFinite(volume)||volume<0||!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)))error=`Row ${i+1}: enter blood removed in mL, including discarded blood (zero or more).`;
  if(used&&!error&&volume===0&&/[1-9]/.test(raw.split(/[eE]/)[0]))error=`Row ${i+1}: volume is below supported numeric precision.`;
  if(used&&!error&&!Number.isFinite(sum+volume))error=`Row ${i+1}: sheet total exceeds the supported numeric range.`;
  if(error){complete=false;errors.push({row:i,message:error});}
  if(used&&!error)sum+=volume;
  return {...row,used,error,displayVolume:raw.replace(/^\./,'0.'),running:used&&complete?sum:null};
 });
 return {rows,errors,valid:complete,hasEntries,total:complete?sum:null};
}
function bloodLogFormat(n){if(!Number.isFinite(n))throw Error('Sheet total is outside the supported numeric range.');return Number(n.toPrecision(12)).toString();}
if(typeof module!=='undefined')module.exports={bloodDrawLog,bloodLogFormat};
