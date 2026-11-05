// Optional Playwright regression for fixed unit suffixes; no calculation rules.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const base=process.env.ER_REFERENCE_TEST_URL||'http://127.0.0.1:8000';
 for(const name of fs.readdirSync('dist').filter(n=>n.endsWith('.html')))for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/'+name);
  const broken=await page.evaluate(()=>[...document.querySelectorAll('.unit-input')].filter(n=>n.getBoundingClientRect().width>0).flatMap(n=>{
   const field=n.querySelector('input,select'),suffix=n.querySelector('.unit-input-suffix'),a=field.getBoundingClientRect(),b=suffix.getBoundingClientRect();
   return b.left<a.left||b.right>a.right+1||b.top<a.top-1||b.bottom>a.bottom+1?[field.id+': suffix outside field']:[];
  }));assert.deepEqual(broken,[],name+' '+width);
 }
 await page.goto(base+'/sodium.html');assert.equal(await page.locator('#nCurrent + .unit-input-suffix').innerText(),'mEq/L');
 assert.equal(await page.locator('#nDailyLimit + .unit-input-suffix').innerText(),'mEq/L/24 hr');
 await page.locator('#nCurrent').fill('160.5');assert.equal(await page.locator('#nCurrent').inputValue(),'160.5');
 assert.equal(await page.locator('#nCurrent + .unit-input-suffix').getAttribute('contenteditable'),null);
 await page.locator('#masterWeight').fill('');await page.locator('#masterWeight').pressSequentially('4.5');assert.equal(await page.locator('#masterWeight').inputValue(),'4.5');
 await page.emulateMedia({media:'print'});await page.pdf({path:'/tmp/input-units-print.pdf',format:'Letter'});await page.emulateMedia({media:'screen'});
 await page.goto(base+'/chocolate.html');const amount=page.locator('[id^="chocAmount"]').first();assert.equal(await amount.locator('..').locator('.unit-input-suffix').innerText(),'oz');
 await page.locator('[id^="chocG"][aria-pressed]').first().click();assert.equal(await amount.locator('..').locator('.unit-input-suffix').innerText(),'g');
 await page.goto(base+'/drugs.html');await page.locator('#maropitantUnit').selectOption('mcg/kg per dose');assert.equal(await page.locator('#maropitantDose + .unit-input-suffix').innerText(),'mcg/kg per dose');
 assert.deepEqual(errors,[]);console.log('Fixed units passed: all pages desktop/mobile, suffix bounds, sodium units, numeric/decimal entry, dynamic chocolate units and print generation.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
