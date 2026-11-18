/* Architecture descriptions mirror model source and final_runs/config.json. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const five = [
    {name:'Hemodinámica', vars:['HR','SBP','MAP','DBP','Lactate'], why:'Reúne frecuencia cardíaca, presiones y lactato para representar conjuntamente señales circulatorias y metabólicas.'},
    {name:'Respiración y oxigenación', vars:['Resp','O2Sat','SaO2','FiO2','PaCO2','pH'], why:'Combina frecuencia respiratoria, saturaciones, aporte de oxígeno y gases sanguíneos; el pH acompaña el componente ácido-base.'},
    {name:'Función renal y bioquímica', vars:['BUN','Creatinine','Calcium','Magnesium','Phosphate','Potassium','Glucose'], why:'Agrupa marcadores renales, electrolitos y glucosa para procesar su evolución de forma conjunta.'},
    {name:'Perfil hepático', vars:['AST','Alkalinephos','Bilirubin_total'], why:'Reúne enzimas y bilirrubina en una rama dedicada al perfil hepático.'},
    {name:'Hematología y temperatura', vars:['Hct','Hgb','WBC','Platelets','Temp'], why:'Integra recuentos y componentes sanguíneos con temperatura, como parte del diseño de esta agrupación.'}
  ];
  const three = [
    {name:'Hemodinámica, oxigenación y temperatura', vars:[...five[0].vars,...five[1].vars,'Temp'], why:'Une las ramas hemodinámica y respiratoria e incorpora temperatura: permite interacciones entre estas 12 variables dentro de una misma recurrencia.'},
    {name:'Función renal, bioquímica y perfil hepático', vars:[...five[2].vars,...five[3].vars], why:'Reúne las ramas renal-bioquímica y hepática en un grupo de 10 variables para representar su evolución conjunta.'},
    {name:'Hematología', vars:['Hct','Hgb','WBC','Platelets'], why:'Conserva una rama para los cuatro indicadores sanguíneos. La temperatura pasa a la primera torre.'}
  ];
  const temporal = ['HR','O2Sat','Temp','SBP','MAP','DBP','Resp','FiO2','pH','PaCO2','SaO2','AST','BUN','Alkalinephos','Calcium','Creatinine','Glucose','Lactate','Magnesium','Phosphate','Potassium','Bilirubin_total','Hct','Hgb','WBC','Platelets'];
  const models = {
    vs: {
      title:'VS-GRU · una dinámica por variable', kicker:'RECURRENCIAS INDEPENDIENTES', tag:'26 estados escalares',
      description:'Cada variable conserva su propio estado escalar y sus propios pesos recurrentes. La información de distintas variables se combina al final, junto con el contexto del paciente. En las corridas finales se utiliza una salida sigmoide directa sobre esa combinación.',
      caption:'Recorrido de VS-GRU. Las ramas de HR y O₂Sat son ejemplos; las otras 24 variables también se procesan de forma independiente. Se utiliza el estado final de cada rama.',
      reading:[['Sensibilidad a la ausencia','Además de los decaimientos del valor y del estado, las compuertas reciben una transformación aprendida de la tasa de faltantes de cada variable en la ventana. El cálculo excluye las horas de relleno.'],['Resumen y salida','Los 26 estados finales se concatenan con los 5 datos de contexto y sus 5 indicadores de ausencia. Las configuraciones finales usan una capa sigmoide directa, sin atención temporal ni capa densa oculta.']],
      groupsTitle:'26 variables, 26 recorridos independientes.', groupsKicker:'ORGANIZACIÓN POR VARIABLE',
      groupsDescription:'Cada variable se procesa por separado hasta la fusión final. Los nombres siguientes corresponden a las 26 variables temporales conservadas.'
    },
    five: {
      title:'GRU-D · cinco torres clínicas', kicker:'AGRUPACIÓN POR DOMINIOS', tag:'5 + 6 + 7 + 3 + 5 variables', groups:five,
      description:'Cada torre procesa conjuntamente las variables de un dominio mediante una GRU-D multivariada. Una atención temporal resume sus estados a lo largo de la ventana. Los cinco resúmenes se fusionan con el contexto antes de producir la estimación.',
      caption:'Recorrido de la arquitectura de 5 torres. Cada rama tiene su propia GRU-D y atención sobre las horas válidas. Las 26 variables aparecen una sola vez en la agrupación.',
      reading:[['Interacciones dentro del dominio','Las variables de una torre actualizan un estado multivariado compartido. Cada rama aprende sus propios decaimientos y parámetros recurrentes.'],['Atención y fusión','La atención pondera las horas dentro de cada torre. Los cinco resúmenes y el contexto se concatenan y pasan por una capa densa ReLU, dropout y la salida sigmoide.']],
      groupsTitle:'Cinco dominios, una representación por torre.', groupsKicker:'VARIABLES Y CRITERIO DE AGRUPACIÓN',
      groupsDescription:'La separación busca especializar cada rama en un conjunto de señales relacionadas. Es el criterio de diseño de la arquitectura implementada.'
    },
    three: {
      title:'GRU-D · tres torres amplias', kicker:'INTEGRACIÓN ENTRE DOMINIOS', tag:'12 + 10 + 4 variables', groups:three,
      description:'Mantiene el mismo mecanismo de GRU-D, atención temporal y fusión del modelo de cinco torres, pero reorganiza las variables en tres ramas más amplias. Cambia qué señales pueden interactuar dentro de una misma recurrencia.',
      caption:'Recorrido de la arquitectura de 3 torres. Hemodinámica y respiración se reúnen con temperatura; función renal y bioquímica se reúnen con el perfil hepático; hematología conserva una rama propia.',
      reading:[['Dominios que se reúnen','La primera torre combina hemodinámica, respiración y temperatura; la segunda reúne función renal, bioquímica y perfil hepático. La tercera procesa los cuatro indicadores hematológicos.'],['Mismo mecanismo de salida','Cada una de las tres ramas genera un resumen mediante atención temporal. Los resúmenes y el contexto se fusionan con una capa densa ReLU, dropout y salida sigmoide.']],
      groupsTitle:'Tres ramas que reúnen los mismos 26 predictores.', groupsKicker:'CÓMO SE REAGRUPAN LAS CINCO TORRES',
      groupsDescription:'La reducción de ramas amplía el conjunto de variables que interactúan en cada GRU-D. Temperatura cambia de la rama hematológica a la primera torre.'
    }
  };
  const chips = variables => variables.map(v=>`<code>${v}</code>`).join('');
  function renderDiagram(key, model) {
    const lanes = key === 'vs' ? [
      ['HR','VS-GRU','Estado final h(HR)'],['O₂Sat','VS-GRU','Estado final h(O₂Sat)'],['Otras 24 variables','24 recurrencias independientes','24 estados finales']
    ] : model.groups.map(group=>[group.name,`GRU-D · ${group.vars.length} variables`,'Atención temporal']);
    return `<div class="diagram-input"><span class="diagram-label">ENTRADA TEMPORAL</span><b>Ventana del paciente</b><span>26 variables · 4 datos</span><small>Por variable y hora<br>Más máscara de horas válidas</small></div>
      <div class="diagram-connector" aria-hidden="true"></div>
      <div class="diagram-lanes">${lanes.map(([label,cell,end])=>`<div class="diagram-lane"><span class="lane-name">${label}</span><div class="lane-cell"><b>${cell}</b><span>${end}</span></div></div>`).join('')}</div>
      <div class="diagram-connector" aria-hidden="true"></div>
      <div class="diagram-fusion"><span class="diagram-label">FUSIÓN</span><b>Concatenación</b><span>${key==='vs'?'26 estados finales':model.groups.length+' resúmenes'}</span><div class="context-input">+ Contexto del paciente<small>5 datos de contexto<br>+ 5 indicadores de ausencia</small></div>${key==='vs'?'':'<div class="fusion-dense">Densa · ReLU<small>Dropout</small></div>'}</div>
      <div class="diagram-connector" aria-hidden="true"></div>
      <div class="diagram-output"><span class="diagram-label">SALIDA</span><b>Sigmoide</b><strong>p<sub>t</sub></strong><span>Estimación entre 0 y 1<br>para la hora actual</span></div>`;
  }
  function render(key) {
    const model = models[key];
    $('#model-title').textContent = model.title;
    $('#model-kicker').textContent = model.kicker;
    $('#model-tag').textContent = model.tag;
    $('#model-description').textContent = model.description;
    $('#model-diagram').innerHTML = renderDiagram(key,model);
    $('#model-diagram-caption').textContent = model.caption;
    $('#model-reading').innerHTML = model.reading.map(([title,text])=>`<article><h4>${title}</h4><p>${text}</p></article>`).join('');
    $('#model-groups-title').textContent = model.groupsTitle;
    $('#model-groups-kicker').textContent = model.groupsKicker;
    $('#model-groups-description').textContent = model.groupsDescription;
    $('#model-groups').classList.toggle('individual-variables',key==='vs');
    $('#model-groups').innerHTML = key==='vs' ? `<div class="variable-chips">${chips(temporal)}</div><p class="note">Cada variable tiene un estado escalar: se obtienen 26 estados antes de incorporar el contexto.</p>` : model.groups.map(group=>`<article class="model-group"><div class="model-group-head"><h4>${group.name}</h4><span>${group.vars.length} variables</span></div><p>${group.why}</p><div class="variable-chips">${chips(group.vars)}</div></article>`).join('');
    document.querySelectorAll('[data-model]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.model===key)));
  }
  document.querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.model)));
  render('vs');
})();
