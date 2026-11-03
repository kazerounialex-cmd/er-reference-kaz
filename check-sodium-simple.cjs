const assert=require('node:assert/strict'),fs=require('node:fs'),{sodiumWaterReference,mixFinal,freeWater}=require('./dist/electrolyte-calc.js');
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
