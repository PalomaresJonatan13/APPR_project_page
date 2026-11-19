# Presentación APPR

Abre `index.html` directamente en un navegador. No requiere instalación, conexión a Internet ni servidor; los enlaces a fuentes externas sí requieren conexión.

Secciones desarrolladas: **Sepsis**, **Datos**, **Preparación de los datos**, **Modelos**, **Entrenamiento**, **Evaluación y comparación** y **Conclusiones**. Cada sección termina con un enlace a la siguiente, salvo Conclusiones.

- `index.html`: estructura y contenido.
- `styles.css`: estructura visual y estilos adaptables.
- `theme.css`: paleta de azul petróleo (`#163344`), teal (`#0C756F`) y blanco frío (`#F5F8FA`), con tonos claros para superficies. Se carga después de los estilos de estructura.
- `app.js`: pestañas, selector de conjuntos y explorador de variables.
- `models.js`: explorador de las tres arquitecturas, diagramas y agrupaciones de variables, contrastados con las implementaciones y configuraciones finales.
- `experiments.js`: configuraciones de entrenamiento y comparación interactiva de métricas de validación y prueba.
- `experiment-data.js`: agregados de las 12 corridas guardadas, sin predicciones individuales ni tiempos.
- `summarize_experiments.py`: lee configuraciones, ensayos, asignaciones y métricas de `final_runs/`; actualiza únicamente `experiment-data.js` en esta carpeta. Comprueba que las cohortes de prueba coincidan entre corridas y que el manifiesto registre cero pacientes compartidos con desarrollo.
- `data-summary.js`: estadísticas agregadas de los archivos originales del proyecto.
- `summarize_data.py`: regenera el resumen utilizando únicamente la biblioteca estándar de Python. Lee `../APPR_project/data/csv/set_A.csv` y `set_B.csv`; escribe solo `data-summary.js` en esta carpeta.

Para actualizar las estadísticas desde esta carpeta:

```powershell
python -B summarize_data.py
python -B summarize_experiments.py
```

Los recuentos y porcentajes se contrastaron con las salidas de `APPR_project/notebooks/exploration.ipynb`, especialmente las celdas de resumen de cohortes y comparación de faltantes. El porcentaje combinado se pondera por número de registros, no por número de pacientes.

Fuentes de contexto: ficha de sepsis de la OMS (2024, cifras globales referidas a 2017) y documentación oficial de PhysioNet/CinC 2019, enlazadas en la página.

En evaluación, la vista inicial compara las tres corridas completas entrenadas con A+B sobre prueba A+B. Los filtros permiten cambiar entrenamiento, etapa, partición y cohorte evaluada. La validación de las corridas completas con A contiene predicciones fuera de pliegue (CV de 3 pliegues); A+B usa holdout. El AP agrupado de validación cruzada se distingue de la media del AP por pliegue utilizada en selección. La comparación piloto/completo siempre utiliza la misma cohorte de prueba.

En entrenamiento se muestra el AP de referencia y el cociente entre el AP de selección y esa referencia. La referencia es la fracción de horas positivas de validación; en CV se promedia entre los mismos pliegues, a partir de las filas de `fold_metrics.csv` correspondientes al ensayo seleccionado.

Conclusiones sintetiza `APPR_project/docs/conclusiones_modelos.md` (revisión del 18 de noviembre de 2026): hallazgos, alcance clínico, limitaciones de optimización y arquitectura, explicabilidad por torre pendiente y prioridades de evaluación posterior.
