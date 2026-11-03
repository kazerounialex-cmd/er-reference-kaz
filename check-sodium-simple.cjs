const assert=require('node:assert/strict'),fs=require('node:fs'),{sodiumWaterReference,mixFinal,freeWater,sodiumBolusReference,sodiumBagReference}=require('./dist/electrolyte-calc.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
// Independent examples recomputed from inputs, not cached workbook results.
const p={weight:2.79,current:168,target:155,type:'chronic',customHours:null};
let r=sodiumWaterReference(p);near(r.liters,.1404);near(r.hours,31.2);near(r.mlPerHour,4.5);near(r.dayChange,10);assert.equal(r.dailyWarning,false);
r=sodiumWaterReference({...p,customHours:28});near(r.mlPerHour,5.014285714285714);assert.equal(r.dailyWarning,true);
// Legacy Original Sheet arithmetic is preserved, not silently rewritten.
near(freeWater(p).hours,26);
r=sodiumWaterReference({...p,current:180,target:158,weight:10});near(r.hours,52.8);near(r.liters*1000,835.4430379746835);near(r.mlPerHour,15.822784810126582);
near(sodiumWaterReference({...p,type:'acute'}).hours,13);
r=sodiumWaterReference({...p,target:168});assert.equal(r.hours,0);assert.equal(r.mlPerHour,0);
for(const change of [{weight:0},{target:169},{customHours:0},{current:NaN},{customHours:1}])assert.throws(()=>sodiumWaterReference({...p,...change}));
r=mixFinal({volume:1000,base:130,stock:0,target:117});near(r.additive,100);near(r.carrier,900);near(r.verified,117);
r=mixFinal({volume:1000,base:140,stock:0,target:117});near(r.additive,164.28571428571428);near(r.carrier,835.7142857142857);
r=mixFinal({volume:1000,base:130,stock:1232,target:165});near(r.additive,31.76043557168784);
const html=fs.readFileSync('dist/sodium.html','utf8');for(const id of ['nWaterMath','nMixMath','hResponseMath','nQuickMath','nGlucoseMath'])assert(html.includes(`<section id="${id}"`),id+' must show math without disclosure');
assert(!/id="sodium(?:Guidance|Tracker)"[^>]*\bopen\b/.test(html));assert(html.indexOf('id="sodiumTracker"')>html.indexOf('id="mixingTool"'));
console.log('Simple sodium reference passed: independent D5W and replacement-mixture examples, approved hourly/daily timing, custom-hour warnings, legacy arithmetic, invalid values, visible math and optional bottom tracker.');

for(const [dailyLimit,hours,rate]of [[10,31.2,4.5],[11,312/11,4.95],[12,26,5.4]]){
 const r=sodiumWaterReference({...p,dailyLimit});near(r.hours,hours);near(r.mlPerHour,rate);near(r.dayChange,dailyLimit);assert.equal(r.dailyWarning,false);
}
assert.equal(sodiumWaterReference({...p,dailyLimit:11,customHours:28}).dailyWarning,true);
assert.equal(sodiumWaterReference({...p,dailyLimit:12,customHours:28}).dailyWarning,false);
for(const dailyLimit of [0,9,13,NaN,'11',null])assert.throws(()=>sodiumWaterReference({...p,dailyLimit}));
near(sodiumWaterReference({...p,type:'acute',dailyLimit:12}).hours,13);
assert.throws(()=>sodiumWaterReference({...p,dailyLimit:12,customHours:25}));
// Workbook quick reference adds stock to an unchanged 1 L saline bag.
const saline10=mixFinal({volume:1010,base:154,stock:1232,target:(154000+12320)/1010});
near(saline10.additive,10);near(saline10.verified,164.67326732673268);
const saline25=mixFinal({volume:1025,base:154,stock:1232,target:(154000+30800)/1025});
near(saline25.additive,25);near(saline25.verified,180.29268292682926);
assert.equal(Math.round(saline10.verified),165);assert.equal(Math.round(saline25.verified),180);
assert(html.includes('id="sodiumQuickReference"'));
// Final volumes are now dynamic; their independent numeric assertions remain above.
assert(html.includes('Remember potassium as needed.'));

const bolus=sodiumBolusReference(1000);
for(const [i,a,b] of [[0,10,25],[1,23.430178069353326,38.02281368821293],[2,32.80224929709466,47.52851711026616]]){near(bolus[i].preparations[0].stockMl,a);near(bolus[i].preparations[1].stockMl,b);}
near(sodiumBolusReference(500)[2].preparations[0].stockMl,16.40112464854733);
for(const v of [0,-1,NaN,Infinity,1e308,Number.MIN_VALUE])assert.throws(()=>sodiumBolusReference(v));
let bag=sodiumBagReference({volume:500,rate:50,current:180,target:158});near(bag.hours,10);near(bag.plannedNa,175);assert.equal(bag.dailyWarning,false);
bag=sodiumBagReference({volume:1000,rate:40,current:180,target:158});near(bag.hours,25);near(bag.plannedNa,167.5);assert.equal(bag.dailyWarning,true);
assert.equal(sodiumBagReference({volume:1000,rate:40,current:180,target:158,dailyLimit:12}).dailyWarning,false);
near(sodiumBagReference({volume:1000,rate:50,current:160,target:158}).plannedNa,158);
assert.equal(sodiumBagReference({volume:1000,rate:50}).plannedNa,null);
for(const change of [{volume:0},{rate:0},{rate:NaN},{volume:1e308,rate:1e-100},{current:160,target:180}])assert.throws(()=>sodiumBagReference({volume:500,rate:50,current:180,target:158,...change}));
