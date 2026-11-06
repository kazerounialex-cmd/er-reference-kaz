const assert=require('node:assert/strict'),{phosphate}=require('./dist/electrolyte-calc.js'),verify=require('./dist/preparation-check.js');
const p={weight:10,dose:.06,fluidRate:40,volume:1000,phosStock:3,kStock:4.4,otherK:.5,method:'final'};
assert.throws(()=>phosphate(p),e=>e.code==='PHOSPHATE_TOTAL_K'&&Math.abs(e.totalK-.588)<1e-12);
for(const overrideTotalK of [false,'true',1])assert.throws(()=>phosphate({...p,overrideTotalK}),/exceeds/);
const allowed={...p,overrideTotalK:true},r=phosphate(allowed),shown=verify.phosphate(allowed,r);
// 0.06 mmol/kg/hr × 10 kg / 40 mL/hr = 0.015 mmol/mL;
// 1000 mL × 0.015 / 3 = 5 mL additive, 22 mEq K, 0.088 K + 0.5 concurrent.
assert.equal(r.additive,5);assert.equal(shown.potassiumAmount,22);assert.ok(Math.abs(shown.totalK-.588)<1e-12);
assert.throws(()=>verify.phosphate(p,r),e=>e.code==='PHOSPHATE_TOTAL_K');
const rounded={...p,dose:.061,otherK:.4105},nominal=phosphate(rounded);
assert.ok(nominal.totalK<.5);assert.throws(()=>verify.phosphate(rounded,nominal),e=>e.code==='PHOSPHATE_TOTAL_K'&&Math.abs(e.totalK-.50026)<1e-12);
assert.ok(Math.abs(verify.phosphate({...rounded,overrideTotalK:true},nominal).totalK-.50026)<1e-12);
for(const invalid of [{weight:0},{fluidRate:0},{volume:-1},{phosStock:0},{dose:.13},{otherK:NaN},{dose:.12,fluidRate:.01}])assert.throws(()=>phosphate({...allowed,...invalid}));
const unblocked={...p,otherK:0};assert.equal(phosphate(unblocked).additive,5);
console.log('Phosphate override: explicit-only exception, independent nominal/displayed K totals, rounding-only excess, invalid/physical guards and unchanged default calculations passed.');
