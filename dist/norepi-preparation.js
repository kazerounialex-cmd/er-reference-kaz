(() => {
  const $ = id => document.getElementById(id);
  const concentrationPreset = $('norepiConcentrationPreset');
  const concentrationField = $('prepConcentration');
  const volumeField = $('norepiVolume');
  const stockField = $('criStock');
  const doseField = $('criDose');
  const pumpField = $('norepiPump');
  const accessField = $('norepiCentral');
  const peripheryLimit = 16;
  const maximum = 64;
  const centralMessage = 'Central catheter required for concentrations >16 mcg/mL.';
  const unit = 'mcg/kg/min';
  const show = value => Number(value.toPrecision(12)).toString();
  const amount = value => value < 0.0005 ? value.toExponential(3) : value.toFixed(3);
  const positive = value => Number.isFinite(value) && value > 0;
  let centralConfirmed = false;
  let manualPump = false;
  let lastConcentration = Number(concentrationPreset.value);

  function preparation(stock, concentration, volume) {
    CriCalc.positive(stock, concentration, volume);
    if (concentration >= stock) throw Error('Prepared concentration must be below the verified stock strength.');
    const { drug, diluent } = CriCalc.mix(stock, concentration, volume);
    CriCalc.positive(drug, diluent);
    const roundedStock = amount(drug);
    // Preserve the access ceiling even when a three-place display would exceed it.
    const limit = concentration <= peripheryLimit ? peripheryLimit : maximum;
    const roundedAboveLimit = Number(roundedStock) * stock / volume > limit * (1 + Number.EPSILON * 4);
    const roundingChangesAmount = Math.abs(Number(roundedStock) / drug - 1) > 0.01;
    const extraPrecision = roundedAboveLimit || roundingChangesAmount;
    const stockVolume = extraPrecision ? show(drug) : roundedStock;
    return { stockVolume, diluent: amount(diluent), finalVolume: amount(volume),
      review: drug < 1 || extraPrecision || Number(stockVolume) !== drug };
  }

  function reference(stock, central) {
    $('norepiReferenceNote').textContent = positive(stock)
      ? `Calculated using ${stock} mcg/mL norepinephrine-equivalent stock. Verify measurement feasibility.`
      : 'Enter a valid stock strength to view reference amounts.';
    $('norepiReference').innerHTML = [8, 16, 32, 64].map(concentration => {
      const access = concentration > peripheryLimit ? (central ? ' · central access' : ' · central access, reference only') : '';
      const amounts = [12, 30, 60].map(volume => {
        try { return `<td>${preparation(stock, concentration, volume).stockVolume}</td>`; }
        catch { return '<td>—</td>'; }
      });
      return `<tr><th scope="row">${concentration}${access}</th>${amounts.join('')}</tr>`;
    }).join('');
  }

  function setPreview(open) {
    $('norepiChartPreview').hidden = !open;
    $('previewNorepiChart').setAttribute('aria-expanded', String(open));
    $('previewNorepiChart').textContent = open ? 'Hide chart' : 'Show chart';
  }

  function printAvailability(available) {
    $('norepiTitration').setAttribute('data-print-ready', String(available));
    $('printNorepiChart').disabled = !available;
    $('previewNorepiChart').disabled = !available;
    $('norepiChartShortcut').textContent = available ? 'Open printable titration chart' : 'Titration chart availability';
    $('norepiChartStatus').hidden = available;
    if (!available) {
      $('norepiChartMeta').textContent = '';
      $('norepiChartMix').textContent = '';
      $('norepiChartTable').innerHTML = '';
      setPreview(false);
    }
  }

  function update() {
    const customConcentration = concentrationPreset.value === 'custom';
    const concentration = Number(customConcentration ? concentrationField.value : concentrationPreset.value);
    const volume = Number(volumeField.value);
    const stock = Number(stockField.value);
    const central = centralConfirmed && accessField.checked;
    const needsCentral = concentration > peripheryLimit && !central;
    const tooHigh = concentration > maximum;
    const concentrationError = !positive(concentration) ? 'Enter a positive prepared concentration.'
      : needsCentral ? centralMessage
      : tooHigh ? 'Prepared concentration exceeds the 64 mcg/mL application limit.' : '';

    $('norepiCustomConcentration').hidden = !customConcentration;
    $('norepiPreset32').disabled = !central;
    $('norepiPreset64').disabled = !central;
    $('norepiSwitch').hidden = !needsCentral;
    const activeConcentration = customConcentration ? concentrationField : concentrationPreset;
    concentrationField.setAttribute('aria-invalid', 'false');
    concentrationPreset.setAttribute('aria-invalid', 'false');
    activeConcentration.setAttribute('aria-invalid', String(Boolean(concentrationError)));
    $('norepiConcentrationError').hidden = !concentrationError;
    $('norepiConcentrationError').textContent = concentrationError;
    if (positive(concentration) && concentration !== lastConcentration) {
      $('norepiChange').hidden = false;
      lastConcentration = concentration;
    }

    reference(stock, central);
    $('prepResult').textContent = '';
    $('norepiDelivery').textContent = '';
    pumpField.disabled = true;

    try {
      if (concentrationError) throw Error('Preparation unavailable. Review the concentration and access above.');
      if (!positive(stock)) throw Error('Enter a positive verified stock strength.');
      if (!positive(volume)) throw Error('Enter a positive final preparation volume.');
      const mix = preparation(stock, concentration, volume);
      const instructions = `Norepinephrine stock: ${mix.stockVolume} mL · D5W: ${mix.diluent} mL · Final preparation volume: ${mix.finalVolume} mL.`;
      const measurement = mix.review ? 'Measurement review required. Verify that the stock volume is measurable with approved equipment.' : '';
      $('prepResult').innerHTML = `<h3>Prepare — ${concentration} mcg/mL</h3>
        <dl class="norepi-amounts">
          <div><dt>Norepinephrine stock</dt><dd>${mix.stockVolume} <span>mL</span></dd></div>
          <div><dt>D5W</dt><dd>${mix.diluent} <span>mL</span></dd></div>
          <div><dt>Final preparation volume</dt><dd>${mix.finalVolume} <span>mL</span></dd></div>
        </dl><p>Add D5W to the stated final volume.</p>${measurement ? `<p class="notice">${measurement}</p>` : ''}`;

      const weight = Number($('weight').value);
      if (!positive(weight)) throw Error('Enter a valid shared patient weight to calculate a pump rate.');
      const desiredDose = Number(doseField.value);
      if (!positive(desiredDose)) throw Error('Enter a positive desired dose.');
      pumpField.disabled = false;
      const pump = manualPump ? Number(pumpField.value) : CriCalc.rate(weight, desiredDose, concentration, unit);
      if (!manualPump) pumpField.value = show(pump);
      if (!positive(pump)) throw Error('Enter a positive pump rate.');
      const delivered = pump * concentration / 60 / weight;
      const hours = volume / pump;
      CriCalc.positive(delivered, hours);
      const minutes = hours * 60;
      const duration = hours >= 1 ? `${hours.toFixed(2)} hr`
        : minutes < 0.005 ? '&lt;0.01 min' : `${minutes.toFixed(2)} min`;
      const access = concentration > peripheryLimit
        ? 'Central catheter required and confirmed.' : 'Assess catheter suitability and monitor the site.';
      const doses = [...new Set([...CRI_DATA.norepinephrine.rates, desiredDose])].sort((a, b) => a - b);
      const rows = doses.map(dose => {
        const rate = Number(show(CriCalc.rate(weight, dose, concentration, unit)));
        return `<tr><td>${show(rate)}</td><td>${show(rate * concentration / 60 / weight)}</td><td>${show(dose)}</td></tr>`;
      }).join('');
      $('norepiDelivery').innerHTML = `<div class="cri-output">
        <div><small>Current dose delivered</small><strong>${show(delivered)} ${unit}</strong></div>
        <div><small>Pump rate</small><strong>${show(pump)} mL/hr</strong></div>
        <div><small>Estimated syringe duration</small><strong>${duration}</strong></div></div>`;
      $('norepiChartMeta').textContent = `Patient weight: ${show(weight)} kg. Concentration: ${concentration} mcg/mL. Stock: ${stock} mcg/mL norepinephrine equivalent. Current dose: ${show(delivered)} ${unit}. Current rate: ${show(pump)} mL/hr. ${access}`;
      $('norepiChartMix').textContent = `${instructions} Add D5W to the stated final volume. ${measurement}`.trim();
      $('norepiChartTable').innerHTML = '<thead><tr><th scope="col">Rate · mL/hr</th><th scope="col">Delivers · mcg/kg/min</th><th scope="col">Reference target · mcg/kg/min</th></tr></thead><tbody>' + rows + '</tbody>';
      printAvailability(true);
    } catch (error) {
      if (pumpField.disabled) manualPump = false;
      if (!manualPump) pumpField.value = '';
      $('norepiDelivery').textContent = error.message;
      $('norepiChartStatus').textContent = 'Chart unavailable. ' + error.message;
      printAvailability(false);
    }
  }

  function resetAccess() {
    accessField.checked = false;
    centralConfirmed = false;
    manualPump = false;
    stockField.readOnly = true;
    $('criLock').textContent = 'Edit stock strength';
    update();
  }

  concentrationPreset.addEventListener('change', () => {
    if (concentrationPreset.value === 'custom' && !concentrationField.value) concentrationField.value = lastConcentration;
    manualPump = false;
    update();
  });
  $('norepiSwitch').onclick = () => {
    concentrationPreset.value = '16';
    manualPump = false;
    update();
    concentrationPreset.focus();
  };
  accessField.addEventListener('change', event => {
    centralConfirmed = event.isTrusted && accessField.checked;
    update();
  });
  [concentrationField, doseField, $('weight')].forEach(field => field.addEventListener('input', () => {
    manualPump = false;
    update();
  }));
  [volumeField, stockField].forEach(field => field.addEventListener('input', update));
  pumpField.addEventListener('input', () => {
    manualPump = true;
    update();
  });
  $('criLock').onclick = () => {
    stockField.readOnly = !stockField.readOnly;
    $('criLock').textContent = stockField.readOnly ? 'Edit stock strength' : 'Lock stock strength';
    if (!stockField.readOnly) stockField.focus();
  };
  $('norepiChartShortcut').onclick = () => {
    if (!$('previewNorepiChart').disabled) setPreview(true);
  };
  $('previewNorepiChart').onclick = () => setPreview($('norepiChartPreview').hidden);
  $('printNorepiChart').onclick = () => {
    update();
    if (!$('printNorepiChart').disabled) window.print();
  };
  window.addEventListener('beforeprint', update);
  window.addEventListener('newpatient', () => {
    lastConcentration = peripheryLimit;
    $('norepiChange').hidden = true;
    resetAccess();
  });
  window.addEventListener('pageshow', resetAccess);
  window.addEventListener('patientrestored', resetAccess);
  resetAccess();
})();
