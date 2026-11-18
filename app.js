/* Aggregate data only. No network requests or patient records. */
(() => {
  'use strict';
  const summary = window.DATA_SUMMARY;
  const $ = selector => document.querySelector(selector);
  const integer = value => new Intl.NumberFormat('es-CO').format(value);
  const percent = value => value > 0 && value < 0.005 ? '< 0,01 %' : new Intl.NumberFormat('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value) + ' %';
  const groups = {
    vital: {name: 'Signos vitales', description: 'Frecuencia cardíaca, oxigenación, temperatura y presión arterial.'},
    lab: {name: 'Laboratorio', description: 'Bioquímica, gases sanguíneos, hematología y coagulación.'},
    context: {name: 'Contexto del paciente', description: 'Edad, sexo, unidad y tiempos de ingreso y estancia.'}
  };
  const descriptions = [
    ['HR','Frecuencia cardíaca'],['O2Sat','Saturación periférica de oxígeno'],['Temp','Temperatura corporal'],['SBP','Presión arterial sistólica'],['MAP','Presión arterial media'],['DBP','Presión arterial diastólica'],['Resp','Frecuencia respiratoria'],['EtCO2','CO₂ al final de la espiración'],
    ['BaseExcess','Exceso de bases'],['HCO3','Bicarbonato'],['FiO2','Fracción inspirada de oxígeno'],['pH','Acidez o alcalinidad sanguínea'],['PaCO2','Presión parcial arterial de CO₂'],['SaO2','Saturación arterial de oxígeno'],['AST','Aspartato aminotransferasa'],['BUN','Nitrógeno ureico en sangre'],['Alkalinephos','Fosfatasa alcalina'],['Calcium','Calcio'],['Chloride','Cloruro'],['Creatinine','Creatinina'],['Bilirubin_direct','Bilirrubina directa'],['Glucose','Glucosa'],['Lactate','Lactato'],['Magnesium','Magnesio'],['Phosphate','Fosfato'],['Potassium','Potasio'],['Bilirubin_total','Bilirrubina total'],['TroponinI','Troponina I'],['Hct','Hematocrito'],['Hgb','Hemoglobina'],['PTT','Tiempo de tromboplastina parcial'],['WBC','Recuento de leucocitos'],['Fibrinogen','Fibrinógeno'],['Platelets','Recuento de plaquetas'],
    ['Age','Edad'],['Gender','Sexo según la codificación del dataset'],['Unit1','Indicador de UCI médica'],['Unit2','Indicador de UCI quirúrgica'],['HospAdmTime','Ingreso hospitalario relativo al ingreso en UCI'],['ICULOS','Horas desde el ingreso en UCI']
  ];
  const variables = descriptions.map(([key, description], index) => ({key, description, index, group: index < 8 ? 'vital' : index < 34 ? 'lab' : 'context'}));
  let cohort = 'all';
  const sections = ['sepsis', 'datos', 'preparacion', 'modelos', 'entrenamiento', 'evaluacion', 'conclusiones'];

  function activateSection(name, focus = false) {
    if (!sections.includes(name)) name = 'sepsis';
    document.querySelectorAll('[data-section]').forEach(tab => {
      const active = tab.dataset.section === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('active', active);
      if (active && focus) tab.focus();
    });
    document.querySelectorAll('.panel').forEach(panel => { panel.hidden = panel.id !== name; });
  }
  document.querySelectorAll('[data-section]').forEach(tab => {
    tab.addEventListener('click', () => { history.replaceState(null, '', '#' + tab.dataset.section); activateSection(tab.dataset.section); });
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = sections.indexOf(tab.dataset.section);
      const name = event.key === 'Home' ? sections[0] : event.key === 'End' ? sections.at(-1) : sections[(current + (event.key === 'ArrowRight' ? 1 : -1) + sections.length) % sections.length];
      history.replaceState(null, '', '#' + name);
      activateSection(name, true);
    });
  });
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    history.replaceState(null, '', '#' + button.dataset.go);
    activateSection(button.dataset.go, true);
    $('#contenido').scrollIntoView({block: 'start'});
  }));
  function syncHash() {
    const target = location.hash.slice(1);
    if (target === 'contenido') return;
    activateSection(sections.includes(target) ? target : target === 'fuente-physionet-datos' ? 'datos' : 'sepsis');
  }
  window.addEventListener('hashchange', syncHash);
  syncHash();

  function missingRate(variable) { return summary[cohort].missing[variable.key] / summary[cohort].rows * 100; }
  function renderVariables() {
    const search = $('#variable-search').value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const group = $('#variable-group').value;
    const order = $('#variable-sort').value;
    let visible = variables.filter(v => (group === 'all' || v.group === group) && `${v.key} ${v.description}`.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(search));
    if (order !== 'original') visible.sort((a,b) => order === 'missing' ? missingRate(b)-missingRate(a) : missingRate(a)-missingRate(b));
    $('#variable-rows').replaceChildren();
    for (const variable of visible) {
      const row = document.createElement('tr');
      const rate = missingRate(variable);
      // All values below come from the fixed dictionary and generated aggregate counts.
      row.innerHTML = `<td>${variable.key}</td><td>${variable.description}</td><td>${groups[variable.group].name}</td><td><div class="missing-cell"><span class="mini-track" aria-hidden="true"><span style="width:${rate}%"></span></span><b>${percent(rate)}</b></div></td>`;
      $('#variable-rows').append(row);
    }
    if (!visible.length) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="4">No hay variables que coincidan con la búsqueda.</td>'; $('#variable-rows').append(row); }
    $('#variable-count').textContent = `${visible.length} de 40 variables`;
  }
  function renderCohort() {
    const data = summary[cohort];
    const name = cohort === 'all' ? 'A + B' : cohort;
    $('#metric-patients').textContent = integer(data.patients);
    $('#metric-sepsis').textContent = `${integer(data.sepsis_patients)} pacientes con sepsis`;
    $('#metric-rows').textContent = integer(data.rows);
    $('#metric-prevalence').textContent = percent(data.sepsis_patients/data.patients*100);
    $('#cohort-caption').textContent = `${cohort === 'all' ? 'Vista combinada' : 'Conjunto ' + cohort} · datos originales`;
    $('#missing-cohort').textContent = name;
    const clinical = variables.filter(v => v.group !== 'context');
    const rate = clinical.reduce((total,v) => total + data.missing[v.key],0)/(data.rows * clinical.length)*100;
    $('#missing-total').textContent = `${percent(rate)} de faltantes clínicos`;
    $('#family-summary').innerHTML = Object.entries(groups).map(([key,group]) => {
      const family = variables.filter(v => v.group === key);
      const rate = family.reduce((total,v) => total + data.missing[v.key],0)/(data.rows * family.length)*100;
      return `<article class="family"><div class="family-header"><h4>${group.name}</h4><span>${family.length} variables</span></div><div class="family-percent">${percent(rate)}<span>faltantes</span></div><div class="mini-track" aria-hidden="true"><span style="width:${rate}%"></span></div><p>${group.description}</p></article>`;
    }).join('');
    renderVariables();
  }
  document.querySelectorAll('[data-cohort]').forEach(button => button.addEventListener('click', () => {
    cohort = button.dataset.cohort;
    document.querySelectorAll('[data-cohort]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    renderCohort();
  }));
  ['variable-search','variable-group','variable-sort'].forEach(id => $('#' + id).addEventListener(id === 'variable-search' ? 'input' : 'change', renderVariables));
  $('#cohort-comparison').innerHTML = ['A','B'].map(name => {
    const data = summary[name];
    const rate = data.sepsis_patients/data.patients*100;
    return `<div class="cohort-row"><div class="cohort-row-head"><b>Conjunto ${name}</b><span>${integer(data.sepsis_patients)} / ${integer(data.patients)} · <b>${percent(rate)}</b></span></div><div class="prevalence-track" role="img" aria-label="Conjunto ${name}: ${percent(rate)} de pacientes con sepsis"><span style="width:${rate}%"></span></div></div>`;
  }).join('');
  renderCohort();
})();
