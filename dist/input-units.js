// Presentation only: units never enter the editable numeric value.
(()=>{
 const unitPattern=/(mEq\/L per 24 hours|mEq\/L\/hr|mEq\/kg\/hr|mEq\/kg\/day|mmol\/kg\/hr|mcg\/kg per dose|mg\/kg per dose|mg\/kg\/day|mg\/kg\/hr|mcg\/kg\/min|mcg\/kg\/hr|mL\/kg\/episode|mEq\/mL|mEq\/L|mmol\/mL|mg\/mL|mcg\/mL|mg\/dL|U\/kg\/hr|U\/mL|mL \/ 24 hr|mL \/ 14 days|mL\/hour|mL\/hr|mL\/kg|mL|kg|hours|hr|% of estimated blood volume|%)\)?\s*$/;
 function decorate(input){
  if(input.closest('.unit-input')||!['number','select-one'].includes(input.type)||input.hidden)return;
  const label=input.closest('label')||document.querySelector(`label[for="${input.id}"]`);
  const explicit=label&&[...label.children].find(n=>n.tagName==='SPAN'&&unitPattern.test(n.textContent.trim()));
  let text=explicit?.textContent.trim()||label?.childNodes[0]?.textContent.trim()||input.getAttribute('aria-label')||'';
  let unit=text.replace(/ · locked$/,'').match(unitPattern)?.[1];
  let linkedUnit=input.id.startsWith('chocAmount')?document.getElementById(input.id.replace('Amount','Unit')):input.id.endsWith('Dose')?document.getElementById(input.id.replace(/Dose$/,'Unit')):null;
  if(linkedUnit){unit=linkedUnit.value;input.dataset.unitSource=linkedUnit.id;input.dataset.unitLabel=label?.textContent.trim()||input.getAttribute('aria-label')||'Amount';}
  if(input.id.startsWith('chocPercent'))unit='%';
  if(input.id==='giPerEpisode')unit='mL/kg/episode';
  if(['priorLidocaine','priorBupivacaine'].includes(input.id))unit='mg';
  if(!unit&&/dehydration/i.test(text)&&text.includes('%'))unit='%';
  if(!unit&&/Blood removed \(mL\)/.test(text))unit='mL';
  if(!unit)return;
  // Long contextual qualifiers belong in the label; the suffix contains the unit.
  const suffixUnit=unit==='% of estimated blood volume'?'%':unit==='mEq/L per 24 hours'?'mEq/L/24 hr':unit;
  if(explicit){if(unit==='% of estimated blood volume')label.firstChild.textContent+=' (of estimated blood volume)';explicit.hidden=true;}
  else if(label&&label.firstChild?.nodeType===Node.TEXT_NODE&&unitPattern.test(text)){
   const cleaned=text.replace(unitPattern,'').replace(/[·(\s]+$/,'');
   if(cleaned)label.firstChild.textContent=cleaned+' ';
  }
  const shell=document.createElement('span');shell.className='unit-input';
  const suffix=document.createElement('span');suffix.className='unit-input-suffix';suffix.textContent=suffixUnit;suffix.setAttribute('aria-hidden','true');
  if(input.tagName==='SELECT')shell.classList.add('unit-select');
  shell.style.setProperty('--unit-width',(suffixUnit.length+2)+'ch');
  // Preserve the original accessible label, including units, after hiding its span.
  if(!input.hasAttribute('aria-label'))input.setAttribute('aria-label',(label?.textContent.trim()||text)+' ('+suffixUnit+')');
  input.before(shell);shell.append(input,suffix);
  shell.style.setProperty('--unit-width',((suffix.getBoundingClientRect().width||suffix.textContent.length*7)+8)+'px');
 }
 function scan(root){if(root.matches?.('input,select'))decorate(root);root.querySelectorAll?.('input[type="number"],select').forEach(decorate);}
 scan(document);
 // The fixed header can wrap after units are added; anchor offsets need its final height immediately.
 const header=document.querySelector('.patient-header');if(header)document.documentElement.style.setProperty('--patient-header-height',header.getBoundingClientRect().height+'px');
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)scan(node);}).observe(document.body,{childList:true,subtree:true});
 // Keep a chosen unit visible without putting it into the numeric value.
 function syncChosenUnits(){document.querySelectorAll('[data-unit-source]').forEach(input=>{
  const suffix=input.closest('.unit-input')?.querySelector('.unit-input-suffix'),source=document.getElementById(input.dataset.unitSource);
  if(suffix&&source){suffix.textContent=source.value;input.closest('.unit-input').style.setProperty('--unit-width',((suffix.getBoundingClientRect().width||suffix.textContent.length*7)+8)+'px');input.setAttribute('aria-label',input.dataset.unitLabel+' ('+source.value+')');}
 });}
 document.addEventListener('click',syncChosenUnits);document.addEventListener('change',syncChosenUnits);
})();
