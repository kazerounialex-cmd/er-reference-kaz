const assert=require('node:assert/strict'),{phosphateKclSource}=require('./dist/phosphate-kcl.js');
const patient='["10","dog",null]',record={valid:true,rate:.123456789,patient,signature:'preparation-1',flow:50,linked:true};
assert.deepEqual(phosphateKclSource(record,patient,50),{valid:true,rate:.123456789,signature:'preparation-1'});
assert.equal(phosphateKclSource({...record,rate:0},patient,50).rate,0);
for(const invalid of [undefined,{...record,valid:false},{...record,rate:NaN},{...record,rate:-.1}])assert.equal(phosphateKclSource(invalid,patient,50).valid,false);
assert.equal(phosphateKclSource(record,'different patient',50).valid,false);
assert.equal(phosphateKclSource(record,patient,60).valid,false);
assert.equal(phosphateKclSource({...record,linked:false},patient,60).valid,true);
console.log('Phosphate KCl source checks passed: exact rate, valid zero, invalid/stale patient/shared rate and independent local pump.');
