/* Render only the exported aggregate metrics; never load prediction files. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const runs = window.EXPERIMENT_DATA.runs;
  const architectures = ['vs_gru','semantic_grud','semantic_grud_3'];
  const names = {vs_gru:'VS-GRU', semantic_grud:'5 torres', semantic_grud_3:'3 torres'};
  const n = value => new Intl.NumberFormat('es-CO').format(value);
  const decimal = (value, digits=4) => new Intl.NumberFormat('es-CO',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  const pct = value => decimal(value*100,2)+' %';
  const scientific = value => value === 0 ? '0' : value.toExponential(2).replace('.',',');
  const selectedRuns = (source,stage) => architectures.map(architecture=>runs.find(run=>run.architecture===architecture&&run.source===source&&run.stage===stage));
  const metric = (run,partition,cohort) => run[partition].find(row=>row.source===cohort);
  const row = (label,value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;

  function renderTraining() {
    const source = $('#train-source').value, stage = $('#train-stage').value;
    const selected = selectedRuns(source,stage), first = selected[0];
    const cv = Boolean(first.folds);
    $('#training-cohort').innerHTML = `<div><span>Pacientes de desarrollo utilizados</span><strong>${n(first.development_patients)}</strong></div><div><h4>${cv?'Validación cruzada · 3 pliegues':'Holdout · 80 % / 20 %'}</h4><p>${cv?`En el primer pliegue: ${n(first.first_fold_train)} pacientes de entrenamiento y ${n(first.first_fold_validation)} de validación. Cada paciente se valida una vez. Después se reajusta con los ${n(first.development_patients)} pacientes de A.`:`${n(first.first_fold_train)} pacientes para ajustar pesos y ${n(first.first_fold_validation)} para validación. El modelo guardado conserva los mejores pesos de ese entrenamiento; la validación permanece separada.`}</p></div>`;
    $('#training-configs').innerHTML = selected.map(run=>{
      const hp=run.hyperparameters, vs=run.architecture==='vs_gru';
      const reference=run.reference_ap;
      return `<article class="configuration-card"><div class="configuration-heading"><h4>${names[run.architecture]}</h4><span>${source==='A'?'Solo A':'A + B'}</span></div><dl>${row('Ventana',hp.window+' registros horarios')}${row('Estado recurrente',vs?'1 por variable':hp.units+' unidades por torre')}${row('Capa densa oculta',vs?(hp.use_hidden_dense?'32 unidades':'Sin capa oculta'):hp.dense_units+' unidades · ReLU')}${row('Dropout',vs?'No se aplica':pct(hp.dropout))}${row('Tasa de aprendizaje',scientific(hp.learning_rate))}${row('Tamaño de lote',n(hp.batch_size))}${row('L2 de entrada / recurrente',vs?'No se aplica':scientific(hp.kernel_l2)+' / '+scientific(hp.recurrent_l2))}${row(cv?'Épocas de reajuste':'Época seleccionada',run.fitted_epochs)}</dl><div class="config-score"><span>${cv?'AP medio de los pliegues':'AP de validación'}</span><div class="config-score-value"><strong>${decimal(run.selection_ap)}${cv?` <small>± ${decimal(run.selection_ap_std)}</small>`:''}</strong><span class="ap-multiple">${decimal(run.selection_ap/reference,2)}×<small>AP de referencia</small></span></div>${cv?'<small>Media ± desviación estándar entre 3 pliegues</small>':''}<p class="config-reference">AP de referencia: <b>${decimal(reference)}</b> (${pct(reference)})${cv?' · media entre pliegues':' · validación'}</p></div><p class="note">${stage==='pilot'?`Ensayo seleccionado: ${run.best_trial} de ${run.trials}. ${run.completed_trials} completos y ${run.pruned_trials} podados.`:'Una configuración, heredada del piloto, ajustada de nuevo con la cohorte de desarrollo.'}</p></article>`;
    }).join('');
  }

  function chart(rows,key,baseline) {
    const maximum = key==='utility'?1:Math.max(.2,Math.ceil(Math.max(...rows.map(r=>r.values[key]))*10)/10);
    return rows.map(({run,values})=>`<div class="score-row"><span>${names[run.architecture]}</span><div class="score-track"><span class="score-fill" style="width:${Math.max(0,values[key])/maximum*100}%"></span>${key==='average_precision'?`<i class="baseline-marker" style="left:${baseline/maximum*100}%" aria-hidden="true"></i>`:''}</div><b>${decimal(values[key])}</b></div>`).join('')+`<div class="chart-axis"><span>0</span><span>${decimal(maximum,2)}</span></div><p class="note">${key==='average_precision'?`Línea de referencia: ${decimal(baseline)} (fracción de horas positivas).`:'Escala de referencia: 0 = nunca alertar; 1 = predictor óptimo.'}</p>`;
  }
  function renderEvaluation() {
    const source=$('#eval-training').value,stage=$('#eval-stage').value,partition=$('#eval-partition').value;
    const unavailable = source==='A'&&partition==='validation';
    const bOption=$('#eval-cohort option[value="B"]');
    bOption.disabled=unavailable;
    if(unavailable&&$('#eval-cohort').value==='B') $('#eval-cohort').value='all';
    let cohort=$('#eval-cohort').value;
    $('#eval-cohort option[value="all"]').textContent=unavailable?'Total disponible · A':'Total A + B';
    const selected=selectedRuns(source,stage);
    const rows=selected.map(run=>({run,values:metric(run,partition,cohort)}));
    const first=rows[0].values,cv=Boolean(selected[0].folds)&&partition==='validation';
    const cohortName=cohort==='all'?(unavailable?'A':'A+B'):cohort;
    $('#evaluation-caption').innerHTML=`<strong>${partition==='test'?'Prueba reservada (test)':'Validación'} ${cohortName}</strong><span>Entrenados con ${source} · ${stage==='full'?'desarrollo completo':'piloto de 4.000 pacientes'}${cv?' · predicciones fuera de pliegue':''}</span>`;
    $('#evaluation-stats').innerHTML=[['Pacientes',n(first.patients)],['Horas evaluadas',n(first.hours)],['Horas positivas',n(first.positive_hours)],['Referencia del AP',decimal(first.positive_hour_fraction)]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
    $('#ap-chart').innerHTML=chart(rows,'average_precision',first.positive_hour_fraction);
    $('#utility-chart').innerHTML=chart(rows,'utility',first.positive_hour_fraction);
    const bestAP=Math.max(...rows.map(r=>r.values.average_precision)),bestUtility=Math.max(...rows.map(r=>r.values.utility));
    $('#evaluation-rows').innerHTML=rows.map(({run,values:v})=>`<tr><th scope="row">${names[run.architecture]}</th><td class="${v.average_precision===bestAP?'leading-score':''}">${decimal(v.average_precision)}</td><td class="${v.utility===bestUtility?'leading-score':''}">${decimal(v.utility)}</td><td>${decimal(v.auroc)}</td><td>${pct(v.alert_fraction)}</td><td>${pct(v.recall_at_threshold)}</td><td>${decimal(v.threshold,5)}</td></tr>`).join('');
    $('#evaluation-method').textContent=`Las celdas destacadas son los máximos de AP y utilidad de esta vista. Recall = proporción de horas positivas con alerta; horas con alerta = proporción de todas las horas evaluadas. ${cv?'El AP mostrado se calcula reuniendo las predicciones fuera de pliegue; puede diferir de la media de los AP por pliegue usada en selección.':partition==='validation'?'Estas métricas participan en la selección de configuración y umbral.':'Escalado y umbrales se mantienen fijos desde validación.'} ${source==='A'&&cohort==='B'?'Esta vista de prueba B evalúa transferencia a un conjunto que no se utilizó para entrenar.':''}`;
    $('#pilot-comparison').hidden=partition!=='test';
    $('#progression-cards').innerHTML=architectures.map(architecture=>{
      const pilot=runs.find(r=>r.architecture===architecture&&r.source===source&&r.stage==='pilot');
      const full=runs.find(r=>r.architecture===architecture&&r.source===source&&r.stage==='full');
      const p=metric(pilot,'test',cohort),f=metric(full,'test',cohort);
      return `<article><h4>${names[architecture]}</h4><div class="progression-labels"><span></span><span>Piloto · 4.000</span><span aria-hidden="true"></span><span>Completo · ${n(full.development_patients)}</span></div><div class="progression-values"><span>AP</span><b>${decimal(p.average_precision)}</b><span class="progression-line" aria-hidden="true"></span><b>${decimal(f.average_precision)}</b></div><div class="progression-values"><span>Utilidad</span><b>${decimal(p.utility)}</b><span class="progression-line" aria-hidden="true"></span><b>${decimal(f.utility)}</b></div></article>`;
    }).join('');
  }
  ['train-source','train-stage'].forEach(id=>$('#'+id).addEventListener('change',renderTraining));
  ['eval-training','eval-stage','eval-partition','eval-cohort'].forEach(id=>$('#'+id).addEventListener('change',renderEvaluation));
  renderTraining();
  renderEvaluation();
})();
