const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ER_REFERENCE_TEST_URL||'http://127.0.0.1:8044',fill=(id,v)=>page.locator('#'+id).fill(String(v));
 await page.goto(base+'/potassium.html');await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',8);
 assert.match(await page.locator('#kMagnesiumReference').innerText(),/1.0 mEq\/kg\/day.*0.5 if azotemic/);
 await page.locator('#kMagnesiumReference a').click();await page.waitForTimeout(100);assert.equal(new URL(page.url()).hash,'#magnesiumPreparation');assert.equal(await page.locator('#masterWeight').inputValue(),'8');
 const usual=page.locator('[data-target="mDose"][data-value="1"]'),azotemic=page.locator('[data-target="mDose"][data-value="0.5"]'),context=page.locator('.compact-mg-context');
 assert.equal(await context.getAttribute('open'),null);assert.match(await page.locator('#mBand1').innerText(),/Azotemic/);
 await fill('mVolume',24);await fill('mHours',24);await usual.click();assert.equal(await page.locator('#mResult .primary-output b').innerText(),'2.0 mL');
 await azotemic.click();assert.equal(await page.locator('#mResult .primary-output b').innerText(),'1.0 mL');
 await fill('mHours',12);assert.equal(await page.locator('#mResult .primary-output b').innerText(),'0.50 mL');
 await usual.click();assert.equal(await page.locator('#mResult .primary-output b').innerText(),'1.0 mL');
 // 24 mL at 2 mL/hr lasts 12 hr; 8 kg at 1 mEq/kg/day needs 1 mL of 4 mEq/mL additive.
 await fill('mResultPump',2);assert.equal(await page.locator('#mHours').inputValue(),'12.0');assert.equal(await page.locator('#mResult .primary-output b').innerText(),'1.0 mL');
 await fill('mResultHours',24);assert.equal(await page.locator('#mPump').inputValue(),'1.0');assert.equal(await page.locator('#mResultPump').inputValue(),'1.0');
 await fill('mResultPump','');assert.match(await page.locator('#mResult').innerText(),/Invalid/);assert.equal(await page.locator('#mResultHours').inputValue(),'');
 await fill('mResultHours',24);assert.equal(await page.locator('#mResult .primary-output b').innerText(),'2.0 mL');
 await context.locator(':scope > summary').click();await fill('mBloodwork',2);await page.locator('#mRefractory').selectOption('yes');assert.equal(await page.locator('#mDose').inputValue(),'1');assert.match(await page.locator('#mInterpretation').innerText(),/does not establish ionized Mg status/);
 await fill('mBloodwork',3);assert.equal(await usual.isDisabled(),true);assert.equal(await azotemic.isDisabled(),true);assert.equal(await page.locator('#mPrimaryStatus').isVisible(),true);
 await context.locator(':scope > summary').click();assert.equal(await page.locator('#mPrimaryStatus').isVisible(),true);
 await context.locator(':scope > summary').click();await fill('mBloodwork','');await context.locator(':scope > summary').click();await fill('mHours',24);await usual.click();
 await page.locator('.electrolyte-workspace').screenshot({path:'/tmp/magnesium-simple-desktop.png'});await page.emulateMedia({media:'print'});await page.pdf({path:'/tmp/magnesium-simple.pdf',format:'Letter'});await page.emulateMedia({media:'screen'});
 await page.setViewportSize({width:390,height:950});await page.goto(base+'/potassium.html');await page.locator('#kMagnesiumReference a').click();await page.waitForTimeout(150);
 const chart=await page.locator('#magnesiumPreparation').boundingBox(),header=await page.locator('.patient-header').boundingBox();assert(chart.y>=header.height-2);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);console.log('Magnesium browser passed: verified units/link, usual/azotemic daily amounts, 12-hour math, no lab-driven dose selection, high-Mg guard visible with context closed, mobile and PDF.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
