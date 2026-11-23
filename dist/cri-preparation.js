(()=>{
const $=id=>document.getElementById(id),n=id=>ReferenceNumbers.read($(id)),tool=document.body.dataset.cri,c=CRI_DATA[tool];
const fmt=x=>ReferenceNumbers.format(x);
$('criStock').readOnly=true;$('criLock').onclick=()=>{const f=$('criStock');f.readOnly=!f.readOnly;$('criLock').textContent=f.readOnly?'Edit concentration':'Lock concentration';};
function update(){
 const cat=tool==='lidocaine'&&$('species').value==='Cat';
 if(tool==='lidocaine'){$('catLidocaineWarning').hidden=!cat;['criDose','prepHours','prepPump','prepCapacity','criStock','criLock'].forEach(id=>$(id).disabled=cat);}
 $('prepResult').innerHTML='';
 $('prepMath').textContent='';
 try{
 if(cat)throw Error('Lidocaine CRI is not enabled for cats. All preparation controls are disabled.');
 if(!['Dog','Cat'].includes($('species').value))throw Error('Select species in the shared banner.');
 const factor=tool==='lidocaine'?60/1000:1;
 const r=CriCalc.syringe(n('weight'),n('criDose')*factor,n('criStock'),n('prepHours'),n('prepPump'),n('prepCapacity'));
 const verified=PreparationCheck.cri({...r,stock:n('criStock'),dose:n('criDose'),unit:c.unit},tool,n('weight'));

 $('prepResult').innerHTML=`<div class="cri-output"><div><small>${c.title.toUpperCase()} ADDITIVE</small><strong>${fmt(r.drug)} mL</strong></div><div><small>${c.diluent} DILUENT</small><strong>${fmt(r.diluent)} mL</strong></div></div><p>${PreparationCheck.instruction(verified,c.diluent)} Run at <b>${fmt(r.pump)} mL/hr</b> for <b>${fmt(r.hours)} hours</b>.</p><p class="help">Prescribed target ${n('criDose')} ${c.unit} · displayed preparation delivers ${fmt(verified.delivered)} ${c.unit} · prepared concentration ${PreparationCheck.concentration(verified.concentration)} ${c.stockUnit} · total ${fmt(verified.amount)} mg. Verify the actual formulation and diluent compatibility.</p><p class="preparation-check" role="status">${verified.note}</p>`;
 const mathFmt=x=>ReferenceNumbers.display(x);
 $('prepMath').textContent=`Prescribed calculation before display rounding: Volume ≈ ${mathFmt(r.hours)} hr × ${mathFmt(r.pump)} mL/hr ≈ ${mathFmt(r.volume)} mL. Drug amount ≈ ${n('weight')} kg × ${n('criDose')} ${c.unit} × ${mathFmt(factor)} hourly/unit factor × ${mathFmt(r.hours)} hr ≈ ${mathFmt(r.amount)} mg. Additive ≈ ${mathFmt(r.amount)} ÷ ${n('criStock')} ≈ ${mathFmt(r.drug)} mL. Diluent ≈ ${mathFmt(r.volume)} − ${mathFmt(r.drug)} ≈ ${mathFmt(r.diluent)} mL.`;
 }catch(e){$('prepResult').textContent=e.message;}
}
document.querySelectorAll('input,select').forEach(f=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(f.id))f.addEventListener('input',()=>{ReferenceNumbers.forget(f);update();});});update();
})();
