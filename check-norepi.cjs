const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('dist/cri-norepinephrine.html', 'utf8');
const fields = {};
for (const [, id] of html.matchAll(/ id="([^"]+)"/g)) {
  fields[id] = {
    value: '', checked: false, hidden: false, listeners: {}, attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    fire(type, isTrusted = true) { this.listeners[type]({ isTrusted }); },
    focus() {},
    set textContent(value) { this.content = this.innerHTML = value; },
    get textContent() { return this.content; }
  };
}
for (const [, id, value] of html.matchAll(/<input id="([^"]+)"[^>]* value="([^"]+)"/g)) fields[id].value = value;
for (const [, id, value] of html.matchAll(/<select id="([^"]+)"[^>]*>\s*(?:(?!<\/select>)[\s\S])*?<option value="([^"]+)" selected/g)) fields[id].value = value;
let printCalls = 0;
const events = {};
const context = vm.createContext({
  CriCalc: require('./dist/cri-calc.js'),
  document: { getElementById: id => fields[id] },
  window: {
    addEventListener(type, handler) { events[type] = handler; },
    print() { printCalls++; }
  }
});
for (const file of ['cri-data.js', 'norepi-preparation.js']) vm.runInContext(fs.readFileSync('dist/' + file, 'utf8'), context);
const set = (id, value, type = 'input') => {
  fields[id].value = String(value);
  fields[id].fire(type);
};
const concentration = value => set('norepiConcentrationPreset', value, 'change');
const volume = value => set('norepiVolumePreset', value, 'change');
const central = (checked, trusted = true) => {
  fields.norepiCentral.checked = checked;
  fields.norepiCentral.fire('change', trusted);
};
const unavailable = () => {
  assert.equal(fields.printNorepiChart.disabled, true);
  assert.equal(fields.norepiTitration.attrs['data-print-ready'], 'false');
  assert.equal(fields.norepiChartMeta.textContent, '');
  assert.equal(fields.norepiChartTable.innerHTML, '');
  fields.printNorepiChart.onclick();
};
const delivery = () => fields.norepiDelivery.innerHTML;

assert.equal(fields.criStock.readOnly, true);
assert.equal(fields.norepiPreset32.disabled, true);
assert.equal(fields.norepiPreset64.disabled, true);
assert.equal(fields.criDose.value, '0.05');
assert.match(fields.prepResult.innerHTML, /Prepare — 16 mcg\/mL/);
assert.match(fields.prepResult.innerHTML, /Norepinephrine stock<\/dt><dd>0\.192 <span>mL<\/span>.*\n.*D5W<\/dt><dd>11\.808 <span>mL<\/span>/);
assert.match(fields.prepResult.innerHTML, /Measurement review required/);
assert.match(fields.norepiReference.innerHTML, /16<\/th><td>0\.192<\/td><td>0\.480<\/td><td>0\.960/);
assert.match(fields.norepiReference.innerHTML, /64 · central access, reference only/);
assert.match(delivery(), /valid shared patient weight/);
unavailable();

set('weight', 20);
assert.match(delivery(), /3\.75 mL\/hr/);
assert.match(delivery(), /3\.20 hr/);
assert.match(delivery(), /0\.05 mcg\/kg\/min/);
assert.equal(fields.printNorepiChart.disabled, false);
fields.norepiChartShortcut.onclick();
assert.equal(fields.norepiChartPreview.hidden, false);
fields.printNorepiChart.onclick();
assert.equal(printCalls, 1);
assert.match(fields.norepiChartMeta.textContent, /20 kg.*16 mcg\/mL.*1000 mcg\/mL/);
assert.match(fields.norepiChartMix.textContent, /0\.192 mL.*11\.808 mL/);
const rows = [...fields.norepiChartTable.innerHTML.matchAll(/<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g)];
assert(rows.length >= 5);
for (const [, rate, delivered, target] of rows) {
  assert(Math.abs(Number(rate) * 16 / 60 / 20 - Number(delivered)) < 1e-10);
  assert(Math.abs(Number(delivered) - Number(target)) < 1e-10);
}

concentration(32);
assert.match(fields.norepiConcentrationError.textContent, /Central catheter required/);
assert.equal(fields.prepResult.innerHTML, '');
assert.equal(fields.norepiChartPreview.hidden, true);
unavailable();
central(true, false);
unavailable();
central(true);
assert.equal(fields.norepiPreset32.disabled, false);
assert.match(delivery(), /1\.875 mL\/hr/);
assert.match(delivery(), /6\.40 hr/);
assert.match(fields.norepiChartMeta.textContent, /Central catheter required and confirmed/);
assert.equal(fields.norepiChange.hidden, false);
central(false);
assert.equal(fields.norepiConcentrationPreset.value, '32');
assert.equal(fields.norepiSwitch.hidden, false);
assert.equal(fields.norepiPump.value, '');
unavailable();
fields.norepiSwitch.onclick();
assert.equal(fields.norepiConcentrationPreset.value, '16');

volume(30);
assert.match(fields.prepResult.innerHTML, /0\.480 <span>mL<\/span>.*\n.*D5W<\/dt><dd>29\.520 <span>mL<\/span>/);
assert.match(delivery(), /3\.75 mL\/hr/);
assert.match(delivery(), /8\.00 hr/);
set('norepiPump', 6);
assert.match(delivery(), /0\.08 mcg\/kg\/min/);
assert.match(delivery(), /5\.00 hr/);
volume(60);
assert.match(delivery(), /6 mL\/hr/);
assert.match(delivery(), /10\.00 hr/);
set('norepiPump', 0);
unavailable();
set('criDose', .1);
assert.match(delivery(), /7\.5 mL\/hr/);
concentration(8);
assert.match(delivery(), /15 mL\/hr/);

concentration('custom');
for (const value of [16.00000001, 31, 64, 100]) {
  set('prepConcentration', value);
  unavailable();
}
central(true);
set('prepConcentration', 64);
assert.equal(fields.printNorepiChart.disabled, false);
set('prepConcentration', 64.001);
assert.match(fields.norepiConcentrationError.textContent, /64 mcg\/mL application limit/);
unavailable();
set('prepConcentration', 32);
events.patientrestored();
assert.equal(fields.norepiCentral.checked, false);
assert.equal(fields.prepConcentration.value, '32');
unavailable();
central(true);
events.newpatient();
assert.equal(fields.norepiCentral.checked, false);
unavailable();
set('prepConcentration', 16);
volume('custom');
set('norepiVolume', 12.04);
assert.match(fields.prepResult.innerHTML, /0\.19264 <span>mL/); // 0.193 mL would exceed the 16 mcg/mL policy.
set('norepiVolume', .000001);
assert.match(fields.prepResult.innerHTML, /1\.600e-8 <span>mL/);
set('norepiVolume', '');
assert.equal(fields.prepResult.innerHTML, '');
unavailable();
volume(12);
set('weight', '');
unavailable();
assert.equal(printCalls, 1);
console.log('Norepinephrine preparation passed: independent calculations, exact access boundaries, reset/restore, rounding, pump edits and print validation.');
