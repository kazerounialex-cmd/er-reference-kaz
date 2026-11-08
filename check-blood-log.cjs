const assert=require('node:assert/strict'),{bloodDrawLog,bloodLogFormat}=require('./dist/blood-log-calc.js'),{bloodPlan,cageSheetMarkup,bloodCSV}=require('./dist/blood-calc.js');
let log=bloodDrawLog([{volume:'0.25',reason:'Discard'},{volume:'1.23',site:'Jugular'},{volume:'0'}]);
assert.equal(log.rows.length,16);assert.equal(log.rows[0].running,.25);assert.equal(log.rows[1].running,1.48);assert.equal(log.total,1.48);assert.equal(log.valid,true);assert.equal(log.rows[3].used,false);assert.equal(log.rows[3].running,null);
assert.equal(bloodLogFormat(bloodDrawLog([{volume:'.1'},{volume:'.2'}]).total),'0.3');
for(const volume of ['', '-1', 'NaN', 'Infinity', '0xff', '1e-9999']){const invalid=bloodDrawLog([{volume:'1'},{volume,reason:'CBC'},{volume:'2'}]);assert.equal(invalid.valid,false);assert.equal(invalid.total,null);assert.equal(invalid.rows[0].running,1);assert.equal(invalid.rows[2].running,null);assert.match(invalid.errors[0].message,/Row 2/);}
assert.equal(bloodDrawLog([{volume:'1e308'},{volume:'1e308'}]).total,null);assert.throws(()=>bloodDrawLog(Array(17).fill({})),/16/);
assert.throws(()=>bloodLogFormat(Infinity));assert.equal(bloodDrawLog([{volume:'.25'}]).rows[0].displayVolume,'0.25');assert.equal(bloodDrawLog().hasEntries,false);assert.equal(bloodDrawLog().total,0);
const p={weight:10,volumePerKg:60,reductionPercent:15,dayPercent:1,fortnightPercent:10,draws:[{date:'2026-11-07',time:'12:30',volume:'0.25',site:'<img src=x onerror=alert(1)>',reason:'=SUM(A1:A2)',initials:'AK'},{volume:'1.23',reason:'CBC & chemistry'}]},r=bloodPlan(p);
const html=cageSheetMarkup(p,r),csv=bloodCSV(p,r);
assert.match(html,/>0.25<\/td>/);assert.match(html,/>1.23<\/td>/);assert.match(html,/>1.48<\/td>/);assert.match(html,/Sheet total:<\/b> 1.48 mL/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/Rolling 24-hour total:<\/b> ______/);
assert.match(csv,/"1.23","1.48"/);assert.match(csv,/"'=SUM\(A1:A2\)"/);assert.match(csv,/CBC & chemistry/);
assert.throws(()=>bloodCSV({...p,draws:[{reason:'CBC'}]},r),/Row 1/);assert.match(cageSheetMarkup({...p,draws:[{reason:'CBC'}]},r),/Unavailable — complete draw volumes/);
console.log('Blood draw log: independent cumulative totals, zero/blank/invalid values, incomplete-total propagation, overflow, preserved measurement precision, print/CSV agreement and HTML/formula escaping passed.');
