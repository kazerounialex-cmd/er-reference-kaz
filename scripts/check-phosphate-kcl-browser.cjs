// Optional Playwright regression: only synthetic patient values.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.ER_REFERENCE_TEST_URL||'http://127.0.0.1:8042';
  const go=async file=>{await page.goto(base+'/'+file+'.html');await page.waitForTimeout(50);};
  const fill=async(id,value)=>{await page.locator('#'+id).fill(String(value));await page.waitForTimeout(10);};
  const prep=async()=>{await fill('pRate',50);await fill('pVolume',1000);await fill('pDose',.03);};
  const total=()=>page.locator('#pKclTotal').innerText();
  await go('potassium');await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',10);
  await fill('sharedFluidRate',50);await fill('kVolume',1000);await page.locator('#kSettingsLabel').click();await fill('kOther',.044);await fill('kTarget',.144);
  // 10 mL × 2 mEq/mL / 1000 mL × 50 mL/hr / 10 kg = 0.1.
  await go('phosphate');assert.equal(Number(await page.locator('#pKclRate').inputValue()),.1);
  assert.equal(await page.locator('#pKclActive').isChecked(),false);await prep();
  // KPhos 2 mL × 4.4 mEq/mL / 1000 × 50 / 10 = 0.044.
  assert.match(await total(),/KPhos 0.0440 \+ KCl 0.0000 = 0.0440/);
  await page.locator('#pKclActive').check();assert.match(await total(),/= 0.1440/);assert.equal(await page.locator('#pKclTotalValue').innerText(),'0.1440');
  await go('drugs');await go('phosphate');assert.equal(await page.locator('#pKclActive').isChecked(),true);await prep();assert.match(await total(),/= 0.1440/);
  await fill('pKclRate',.2);assert.match(await total(),/= 0.2440/);
  await fill('pKclRate',.49);assert.match(await page.locator('#pResult').innerText(),/Invalid/);assert.equal(await total(),'Total potassium: —');await fill('pKclRate',.2);assert.match(await total(),/= 0.2440/);
  assert.match(await page.locator('#pKclLinkStatus').innerText(),/Manual override/);
  assert(Math.abs(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('er-reference-concurrent-k-v2')).records.kcl.rate)-.1)<1e-12);
  await go('index');await go('phosphate');assert.equal(Number(await page.locator('#pKclRate').inputValue()),.2);await prep();assert.match(await total(),/= 0.2440/);
  await page.locator('#pKclUseCalculator').click();assert.equal(Number(await page.locator('#pKclRate').inputValue()),.1);assert.equal(await page.locator('#pKclActive').isChecked(),false);
  await page.locator('#pKclActive').check();assert.match(await total(),/= 0.1440/);
  await page.locator('#pKclPanel').screenshot({path:'/tmp/phosphate-kcl-panel.png'});
  await fill('pKclRate',.23);assert.match(await total(),/= 0.2740/);
  await page.locator('form.electrolyte-workspace').evaluate(form=>form.reset());await page.waitForTimeout(40);
  assert.equal(await page.locator('#pKclActive').isChecked(),false);assert.equal(Number(await page.locator('#pKclRate').inputValue()),.1);
  assert.equal(Number(await page.locator('#masterWeight').inputValue()),10);assert.equal(Number(await page.locator('#sharedFluidRate').inputValue()),50);
  await prep();await page.locator('#pKclActive').check();assert.match(await total(),/= 0.1440/);

  await go('potassium');assert.equal(Number(await page.locator('#kTarget').inputValue()),.144);assert.equal(Number(await page.locator('#kVolume').inputValue()),1000);await page.locator('#kSettingsLabel').click();await fill('kOther',0);await fill('kVolume',1000);await fill('kTarget',.2);
  await go('phosphate');assert.equal(Number(await page.locator('#pKclRate').inputValue()),.2);assert.equal(await page.locator('#pKclActive').isChecked(),false);await prep();
  await page.locator('#pKclActive').check();assert.match(await total(),/= 0.2440/);
  await go('potassium');await fill('kTarget','');await go('phosphate');await prep();
  assert.equal(await page.locator('#pOtherK').inputValue(),'');assert.match(await page.locator('#pResult').innerText(),/Invalid/);assert.equal(await page.locator('#pKclTotalValue').innerText(),'—');
  await page.locator('#pKclActive').uncheck();assert.match(await total(),/= 0.0440/);
  await fill('pKclRate',.12);await page.locator('#pKclActive').check();assert.match(await total(),/= 0.1640/);
  await page.setViewportSize({width:390,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await fill('pKclRate','');assert.match(await page.locator('#pResult').innerText(),/Invalid/);
  await page.locator('#clearPatient').click();await page.waitForTimeout(50);
  assert.equal(await page.locator('#pKclRate').inputValue(),'');assert.equal(await page.locator('#pKclActive').isChecked(),false);
  await go('drugs');await page.goBack();await page.waitForTimeout(50);assert.equal(await page.locator('#pKclActive').isChecked(),false);
  // Rounded KCl recipe yields 0.10032; visible 0.10 must not become the calculation input.
  await go('potassium');await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',10);await fill('sharedFluidRate',44);await fill('kVolume',1000);await fill('kTarget',.1);
  await go('phosphate');await prep();await page.locator('#pKclActive').check();
  assert(Math.abs(await page.evaluate(()=>ReferenceNumbers.read(document.getElementById('pOtherK')))-.10032)<1e-12);
  assert.match(await total(),/= 0.1443/);
  assert(Math.abs(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('er-reference-concurrent-k-v2')).records.phosphate.other)-.10032)<1e-12);
  await page.locator('#concurrentPotassium').evaluate(node=>node.open=true);await page.locator('#includeKphos').check();await page.locator('#allPotassiumSources').check();assert.match(await page.locator('#concurrentTotal').innerText(),/^Combined supplemental K/);
  await go('potassium');await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',20);await fill('sharedFluidRate',40);await fill('kVolume',1000);
  await fill('kTarget',.398);assert.equal(await page.locator('#kPeripheralWarning').isVisible(),false);
  await fill('kTarget',.4);assert.equal(await page.locator('#kPeripheralHeading').innerText(),'At peripheral KCl limit');
  await fill('kTarget',.400002);assert.equal(await page.locator('#kPeripheralHeading').innerText(),'Above peripheral KCl limit');
  assert.deepEqual(errors,[]);
  console.log('Phosphate KCl browser passed: source defaults, confirmation, exact totals, override/relink persistence, changed/invalid source, mobile, invalid fields, new patient/history and no errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
