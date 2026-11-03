// Optional real-browser sodium regressions. Serve dist; requires Playwright/Chromium/pdftotext.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.ER_REFERENCE_TEST_URL||'http://127.0.0.1:8000',out=process.env.SODIUM_ARTIFACTS||'/tmp';
  fs.mkdirSync(out,{recursive:true});
  const text=id=>page.locator('#'+id).innerText(),fill=(id,n)=>page.locator('#'+id).fill(String(n)),click=id=>page.locator('#'+id).click();
  async function capture(name){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.waitForTimeout(50);await page.screenshot({path:out+'/'+name,fullPage:true});}
  // Stable UTC browser timezone and synthetic times; avoid dependence on execution date.
  await page.clock.install({time:new Date('2026-11-03T15:00:00Z')});
  await page.goto(base+'/sodium.html');await click('clearPatient');await page.waitForTimeout(50);
  await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',10);
  assert.equal(await page.locator('#nType').inputValue(),'chronic');assert.equal(await page.locator('#sDaily').inputValue(),'10');assert.equal(await page.locator('#nGoal').inputValue(),'158');assert.equal(await page.locator('#sInterval').inputValue(),'4');
  await fill('sharedFluidRate',20);const shared=await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1'));
  await fill('sInitial',180);await fill('sInitialTime','2026-11-03T15:30');await click('sRecordInitial');assert.match(await text('sSampleError'),/future/);await fill('sInitialTime','2026-11-03T14:30');await click('sRecordInitial');
  assert.equal(await page.locator('#sInitial').isEditable(),false);assert.match(await text('sPlanError'),/Confirm/);
  await page.locator('#sTargetConfirmed').check();assert.equal(await text('sNext'),'178.0 mEq/L');assert.match(await text('sDuration'),/52.8/);assert.match(await text('nWater'),/835.4 mL/);assert.match(await text('nWater'),/67.4 mL/);assert.match(await text('sHistorySummary'),/Incomplete 24-hour/);
  // A sodium-containing fluid must not inherit a free-water rate.
  await page.locator('#sPerfusion').selectOption('absent');await page.locator('#sNeuro').selectOption('no');await page.locator('#sFluid').selectOption('lrs');assert.equal(await page.locator('#sRate').inputValue(),'');assert.equal(await page.locator('#sFluidNa').inputValue(),'130');assert.equal(await page.locator('#sFluidK').inputValue(),'4');
  await page.locator('#sFluid').selectOption('d5w');await fill('sRate',10);await page.locator('#sReconciled').check();await click('sSavePlan');assert.equal(await page.locator('#sUseRate').isEnabled(),true);
  await capture('sodium-plan-ready-desktop.png');await page.setViewportSize({width:390,height:950});await capture('sodium-plan-ready-mobile.png');await page.setViewportSize({width:1440,height:1050});
  await page.emulateMedia({media:'print'});await page.pdf({path:out+'/sodium-ready.pdf',format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});
  const ready=execFileSync('pdftotext',[out+'/sodium-ready.pdf','-'],{encoding:'utf8'}).replace(/\s+/g,' ');assert(ready.includes('run at 10 mL/hr'));assert(ready.includes('intended Na 178.0 mEq/L'));assert(ready.includes('toward 179.0 mEq/L'));assert(ready.includes('estimated, not guaranteed'));
  assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('er-reference-sodium-v1')).prescriptions[0].prediction.predicted),180-180/7*0.04);assert(!ready.includes('No current recorded prescription'));
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1')),shared);
  await click('sUseRate');assert.equal(await page.locator('#sharedFluidRate').inputValue(),'10');
  await fill('sRate',11);assert.equal(await page.locator('#sUseRate').isEnabled(),false);assert.match(await text('sActivePlan'),/stale/);assert.equal(await page.locator('#sharedFluidRate').inputValue(),'10');
  await fill('nHours',44);assert.match(await text('sWarnings'),/24-hour/);await fill('nHours',22);assert.match(await text('sWarnings'),/0.5/);await fill('nHours','');
  await fill('nGoal',179);assert.equal(await text('sNext'),'179.0 mEq/L');await fill('nGoal',180);assert.equal(await text('sNext'),'180.0 mEq/L');assert.match(await text('nWater'),/0.00 mL/);await fill('nGoal',181);assert.equal(await text('sNext'),'— mEq/L');assert.match(await text('sPlanError'),/must not exceed/);await fill('nGoal',158);
  await page.locator('#nType').selectOption('acute');assert.equal(await text('sNext'),'— mEq/L');assert.match(await text('sPlanError'),/acute protocol/);assert.match(await text('nWater'),/free-water deficit/);assert.match(await text('sDuration'),/acute reference/);await page.locator('#nType').selectOption('chronic');
  // Invalid/unrecorded sample cannot leave a previous valid plan current.
  await fill('sRepeat',179.9);assert.equal(await text('sNext'),'— mEq/L');await fill('sRepeatTime','2026-11-03T14:30');await click('sRepeatForm button');
  assert.match(await text('sRepeatError'),/later/);await page.reload();assert.equal(await page.locator('#sRepeat').inputValue(),'179.9');assert.equal(await text('sNext'),'— mEq/L');assert.equal(await page.locator('#sHistoryRows tr').count(),1);
  await fill('sRepeatTime','2026-11-03T14:50');await click('sRepeatForm button');assert.equal(await page.locator('#sHistoryRows tr').count(),2);assert.equal(await page.locator('#sInitial').inputValue(),'180');assert.match(await text('sHistorySummary'),/Falling/);assert.match(await text('sHistorySummary'),/0.30 mEq\/L\/hr/);assert.match(await text('sComparison'),/last recorded plan/);assert.match(await text('nWater'),/831.6 mL/);
  const allowance=await text('sAllowance');await fill('sRate',5);await page.locator('#sReconciled').check();await click('sSavePlan');assert.equal(await text('sAllowance'),allowance);assert.equal(await page.locator('#sHistoryRows tr').count(),2);
  await fill('sRepeat',180.1);await fill('sRepeatTime','2026-11-03T14:55');await click('sRepeatForm button');assert.match(await text('sHistorySummary'),/Rising sodium/);assert.equal(await page.locator('#sHistoryRows tr').count(),3);
  await page.locator('#sRepeat').pressSequentially('e');assert.equal(await text('sNext'),'— mEq/L');await page.reload();assert.equal(await text('sNext'),'— mEq/L');await fill('sRepeat',1);await fill('sRepeat','');
  await click('sClearPreparation');assert.equal(await page.locator('#sHistoryRows tr').count(),3);assert.match(await text('sActivePlan'),/prescription/);assert.equal(await page.locator('#sharedFluidRate').inputValue(),'10');
  await page.locator('#sTargetConfirmed').check();await fill('nGoal',158);
  // Laboratory upper-end default applies until a clinician edits the target.
  await click('sClearPreparation');await page.locator('#sLabSettings > summary').click();await fill('sLabLow',140);await fill('sLabHigh',155);await fill('sLabSource','Synthetic test laboratory');await click('sUseLabTarget');assert.equal(await page.locator('#nGoal').inputValue(),'155');await fill('nGoal',157);await fill('sLabHigh',156);assert.equal(await page.locator('#nGoal').inputValue(),'157');
  await page.locator('#masterSpecies').selectOption('cat');assert.equal(await page.locator('#sLabHigh').inputValue(),'');assert.match(await text('sPlanError'),/species differs/);await page.locator('#masterSpecies').selectOption('dog');
  await page.locator('#sTargetConfirmed').check();await page.locator('#sPerfusion').selectOption('absent');await page.locator('#sNeuro').selectOption('no');
  // Navigate away/back: same timed history, no automatic shared-rate edit.
  const before=await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1'));await page.goto(base+'/potassium.html');await page.goto(base+'/sodium.html');assert.equal(await page.locator('#sHistoryRows tr').count(),3);assert.equal(await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1')),before);
  await fill('masterWeight',20);assert.match(await text('nWater'),/1678.5 mL/);await fill('masterWeight','');assert.equal(await text('sNext'),'— mEq/L');await fill('masterWeight',10);
  await page.locator('#sDecline').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'sDaily');await page.locator('#sInterval').focus();await page.locator('#sInterval').hover();const hours=await page.locator('#sInterval').inputValue();await page.mouse.wheel(0,-200);assert.equal(await page.locator('#sInterval').inputValue(),hours);
  // Capture full workflow and narrow layout with populated history.
  await capture('sodium-high-desktop.png');await page.setViewportSize({width:390,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await capture('sodium-high-mobile.png');await page.setViewportSize({width:1440,height:1050});
  await page.emulateMedia({media:'print'});await page.pdf({path:out+'/sodium-high.pdf',format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});
  const high=execFileSync('pdftotext',[out+'/sodium-high.pdf','-'],{encoding:'utf8'}).replace(/\s+/g,' ');assert(high.includes('Free-water estimate'));assert(high.includes('Initial'));assert(!high.includes('Hyponatremia starting plan'));
  // Existing hyponatremia mixing and response calculations stay usable.
  await page.locator('[data-path="hypo"]').click();assert.equal(await page.locator('#hyperWorkflow').isVisible(),false);assert.equal(await page.locator('#mixingTool').isVisible(),true);
  for(const [id,n]of Object.entries({nCurrent:115,nVolume:1000,nFluidGoal:140}))await fill(id,n);await page.locator('[data-base="130"]').click();for(const [id,n]of Object.entries({hFluidK:0,hRate:25,hHours:24}))await fill(id,n);assert.match(await text('hResponse'),/2.1 mEq\/L/);
  await fill('nVolume','');assert.match(await text('nMix'),/Invalid/);assert.equal(await page.locator('#hFluidNa').inputValue(),'');await fill('nVolume',1000);await fill('hFluidK',0);assert.match(await text('hResponse'),/2.1 mEq\/L/);
  await capture('sodium-low-desktop.png');await page.setViewportSize({width:390,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await capture('sodium-low-mobile.png');await page.setViewportSize({width:1440,height:1050});
  await page.emulateMedia({media:'print'});await page.pdf({path:out+'/sodium-low.pdf',format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});const low=execFileSync('pdftotext',[out+'/sodium-low.pdf','-'],{encoding:'utf8'}).replace(/\s+/g,' ');assert(low.includes('Hyponatremia starting plan'));assert(!low.includes('Estimated time to eventual target'));
  await page.locator('[data-path="hyper"]').click();assert.equal(await page.locator('#mixingTool').isVisible(),false);await page.locator('#sAdvanced > summary').click();assert.equal(await page.locator('#mixingTool').isVisible(),true);
  // Clear from another page invalidates this patient's stored history.
  await page.goto(base+'/potassium.html');await click('clearPatient');await page.goBack();await page.waitForTimeout(100);assert.equal(await page.locator('#sHistoryRows tr').count(),0);assert.equal(await page.locator('#sInitial').inputValue(),'');
  // Old sample correctly marks the plan overdue and blocks recording/transferring.
  await page.locator('#masterSpecies').selectOption('cat');await fill('masterWeight',5);await fill('sInitial',180);await fill('sInitialTime','2026-11-02T12:00');await click('sRecordInitial');await page.locator('#sTargetConfirmed').check();await page.locator('#sPerfusion').selectOption('absent');await page.locator('#sNeuro').selectOption('no');await page.locator('#sFluid').selectOption('d5w');await fill('sRate',5);await page.locator('#sReconciled').check();assert.match(await text('sPrescriptionPreview'),/overdue/);assert.equal(await page.locator('#sSavePlan').isEnabled(),false);
  await fill('sRepeat',169);await fill('sRepeatTime','2026-11-03T14:00');await click('sRepeatForm button');assert.match(await text('sHistorySummary'),/Boundary-bracketed/);assert.match(await text('sHistorySummary'),/ceiling exceeded/);assert.match(await text('sAllowance'),/0.00 of 10/);
  assert.deepEqual(errors,[]);console.log('Sodium browser checks passed: both pathways, independent target/duration/water examples, sample chronology/direction, history retention, prescription invalidation, explicit shared transfer, laboratory/species behavior, keyboard/wheel, mobile and three PDFs.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
