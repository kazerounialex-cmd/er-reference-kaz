// High-sodium planning arithmetic. No laboratory range or daily ceiling is inferred.
const SodiumPlan=(()=>{
 const HOUR=3600000,finite=(n,label)=>{if(!Number.isFinite(n))throw Error(`${label} must be a finite number.`);return n;};
 function positive(n,label){finite(n,label);if(n<=0)throw Error(`${label} must be greater than zero.`);return n;}
 function time(value){
  // Require an explicit local date/time; reject calendar normalization (Feb 30, etc.).
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error('Enter a valid sample date and time.');
  const d=new Date(value),parts=value.split(/[-T:]/).map(Number);
  if(!Number.isFinite(d.getTime())||[d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes()].some((n,i)=>n!==parts[i]))throw Error('Enter a valid sample date and time.');
  return d.getTime();
 }
 function sample(na,stamp,previous=null,now=Date.now()){
  positive(na,'Measured sodium');const at=time(stamp);
  if(at>now)throw Error('Sample time cannot be in the future.');
  if(previous&&at<=previous.at)throw Error('Repeat sample time must be later than the previous sample.');
  return {na,at,stamp};
 }
 function history(samples,daily=null){
  if(!samples.length)throw Error('Record the initial sodium and sample time first.');
  samples.forEach((s,i)=>{positive(s.na,'Measured sodium');finite(s.at,'Sample time');if(i&&s.at<=samples[i-1].at)throw Error('Sample times must increase.');});
  if(daily!==null&&daily!==10)throw Error('Select the clinician-approved 24-hour ceiling.');
  const initial=samples[0],latest=samples.at(-1),previous=samples.at(-2),elapsed=previous?(latest.at-previous.at)/HOUR:null;
  const change=previous?latest.na-previous.na:null,hourly=previous?finite(change/elapsed,'Observed hourly change'):null;
  const boundary=latest.at-24*HOUR;
  let anchor=-1;for(let i=0;i<samples.length;i++)if(samples[i].at<=boundary)anchor=i;
  const complete=anchor>=0,start=complete?anchor:0;
  // Count each observed fall, including the whole boundary-straddling segment.
  // Never interpolate a reassuring boundary value or replenish allowance on a rise.
  let decline=0;for(let i=start+1;i<samples.length;i++)decline+=Math.max(0,samples[i-1].na-samples[i].na);
  const remaining=daily===null?null:Math.max(0,daily-decline);
  return {initial,latest,previous,elapsed,change,hourly,total:latest.na-initial.na,direction:change===null?'Initial measurement':change<0?'Falling':change>0?'Rising':'Unchanged',complete,anchor:complete?samples[anchor]:null,rollingChange:complete?latest.na-samples[anchor].na:null,decline,remaining};
 }
 function plan({weight,current,eventual,hours=4,rate=.5,daily,remaining,customHours=null,type='chronic'}){
  if(type!=='chronic')throw Error('Confirmed acute: a complete clinician-approved acute protocol is required for interval prescriptions. No chronic settings are applied.');
  positive(weight,'Patient weight');positive(current,'Current sodium');positive(eventual,'Eventual target');positive(hours,'Next-check interval');finite(hours*HOUR,'Next-check interval');positive(rate,'Planned decline');
  if(eventual>current)throw Error('Eventual target must not exceed the latest sodium in the high-sodium pathway.');
  if(rate>.5)throw Error('Chronic/unknown planned decline must be at or below 0.5 mEq/L/hr.');
  if(daily!==10)throw Error('Select a clinician-approved 24-hour ceiling (10 mEq/L).');
  finite(remaining,'Remaining correction allowance');if(remaining<0||remaining>daily)throw Error('Invalid remaining correction allowance.');
  const delta=current-eventual,next=Math.max(eventual,current-Math.min(rate*hours,remaining));
  const suggestedHours=Math.max(delta/rate,delta*24/daily,remaining>0?delta*24/remaining:0),duration=customHours===null?suggestedHours:positive(customHours,'Custom hours');
  const average=delta===0?0:delta/duration,dayChange=Math.min(delta,average*24),warnings=[];
  if(average>.5+1e-12)warnings.push('Caution: custom duration exceeds 0.5 mEq/L/hr.');
  if(dayChange>daily+1e-12)warnings.push(`Caution: custom duration exceeds the selected ${daily} mEq/L per 24-hour ceiling.`);
  if(dayChange>remaining+1e-12)warnings.push('Caution: duration exceeds the current measured-history allowance in the next 24 hours.');
  if(rate*hours>remaining+1e-12)warnings.push('Caution: next target is limited by the remaining measured-history allowance.');
  if(remaining===0)warnings.push('Caution: no measured-history correction allowance remains. The duration is a reference lower bound only; reassess before prescribing.');
  const water=target=>finite(.6*weight*(current/target-1)*1000,'Free-water estimate');
  if(delta>0&&water(eventual)===0)throw Error('Free-water estimate is below the supported numeric range.');
  const r={next,decline:current-next,suggestedHours,duration,average,dayChange,water:water(eventual),intervalWater:water(next),warnings};
  for(const n of Object.values(r))if(typeof n==='number')finite(n,'Plan result');
  return r;
 }
 return {HOUR,time,sample,history,plan};
})();
if(typeof module!=='undefined')module.exports=SodiumPlan;
