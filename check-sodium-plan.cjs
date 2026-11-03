const assert=require('node:assert/strict'),S=require('./dist/sodium-plan.js'),fs=require('fs');
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),t=Date.UTC(2026,0,1),H=3600000;
const input={weight:10,current:180,eventual:158,hours:4,rate:.5,daily:10,remaining:10};
let p=S.plan(input);assert.equal(p.next,178);near(p.water,835.4430379746835);near(p.intervalWater,67.41573033707865);near(p.duration,52.8);near(p.average,5/12);assert.equal(p.dayChange,10);
// Next interval (4hr), overall correction (52.8hr) and fluid volume are distinct.
assert.notEqual(p.water,p.intervalWater);assert(!('pump' in p));assert(!('crystalloidVolume' in p));
assert.equal(S.plan({...input,eventual:179}).next,179);assert.equal(S.plan({...input,current:158}).water,0);
assert.equal(S.plan({...input,remaining:1}).next,179);near(S.plan({...input,remaining:5}).duration,105.6);near(S.plan({...input,remaining:5}).dayChange,5);assert(S.plan({...input,remaining:5,customHours:52.8}).warnings.some(w=>w.includes('measured-history allowance')));assert.equal(S.plan({...input,remaining:0}).next,180);
assert.equal(S.plan({...input,rate:.25}).duration,88);assert.equal(S.plan({...input,rate:.25}).next,179);
let custom=S.plan({...input,customHours:44});assert(custom.warnings.some(w=>w.includes('24-hour')));assert(!custom.warnings.some(w=>w.includes('0.5')));
custom=S.plan({...input,customHours:22});assert(custom.warnings.some(w=>w.includes('0.5')));assert(custom.warnings.some(w=>w.includes('24-hour')));
for(const change of [{weight:0},{current:NaN},{eventual:181},{rate:.6},{hours:0},{hours:1e308},{daily:12},{daily:null},{type:'acute'},{remaining:-1},{customHours:Infinity},{weight:1e308}])assert.throws(()=>S.plan({...input,...change}));
let samples=[{na:180,at:t},{na:177,at:t+6*H},{na:178,at:t+7*H},{na:176,at:t+9*H}];let h=S.history(samples,10);
assert.equal(h.direction,'Falling');near(h.hourly,-1);assert.equal(h.elapsed,2);assert.equal(h.total,-4);assert.equal(h.decline,5);assert.equal(h.remaining,5);assert.equal(h.complete,false);assert.equal(h.rollingChange,null);
h=S.history(samples.slice(0,3),10);assert.equal(h.direction,'Rising');assert.equal(h.remaining,7);assert.equal(h.total,-2);
samples.push({na:170,at:t+25*H});h=S.history(samples,10);assert.equal(h.complete,true);assert.equal(h.anchor.at,t);assert.equal(h.rollingChange,-10);assert.equal(h.decline,11);assert.equal(h.remaining,0);
// Conservative whole segment straddles the rolling boundary; no fabricated 24h sample.
h=S.history([{na:185,at:t},{na:180,at:t+2*H},{na:179,at:t+25*H}],10);assert.equal(h.anchor.at,t);assert.equal(h.decline,6);
assert.throws(()=>S.history([{na:180,at:t},{na:178,at:t}],10));
const stamp='2026-01-01T10:00',at=new Date(stamp).getTime(),first=S.sample(180,stamp,null,at+H);assert.equal(first.at,at);
for(const invalid of ['', 'not-a-date','2026-02-30T10:00','2026-01-01','2026-13-01T10:00'])assert.throws(()=>S.time(invalid));
assert.throws(()=>S.sample(179,stamp,first,at+H));assert.throws(()=>S.sample(180,stamp,null,at-1));
const fragment=fs.readFileSync('scripts/sodium-workflow.html','utf8');assert(fragment.includes('<option value="chronic">'));assert(fragment.includes('value="4"'));assert(fragment.includes('value="158"'));assert(fragment.includes('10 mEq/L per 24 hours'));assert(fragment.includes('mEq/L/hr'));assert(!fragment.includes('mEq/kg/hr'));
console.log('Sodium planning passed: independent water/target/duration examples, hourly AND daily limits, custom warnings, sample timing/direction, conservative non-resetting history allowance, invalid and acute gating.');

// Moving the same measured trajectory across midnight changes no allowance.
const shifted=samples.map(s=>({...s,at:s.at+13*H}));assert.equal(S.history(shifted,10).remaining,S.history(samples,10).remaining);assert.equal(samples.length,5);
