# Presentación APPR

Abre `index.html` directamente en un navegador. No requiere instalación, conexión a Internet ni servidor; los enlaces a fuentes externas sí requieren conexión.

La vista inicial es una presentación resumida con diez diapositivas: portada, contexto clínico, resumen de datos A+B, grupos de variables con sus faltantes, preparación de los datos, modelos, entrenamiento con búsqueda de hiperparámetros, evaluación en test A+B, conclusiones y cierre. El contenido se agrupa en un marco central de hasta 1080 px. Haz clic en **APPR**, en el encabezado de cualquiera de las vistas, para alternar entre presentación y versión completa. La navegación admite flechas del teclado, scroll, botones y gestos táctiles. En pantallas pequeñas se puede desplazar el contenido de una diapositiva antes de cambiar a la siguiente. Las animaciones respetan la preferencia de movimiento reducido. Para ampliar la presentación, añade secciones `.deck-slide` dentro de `.deck-stage`; el contador y los límites de navegación se calculan automáticamente.

- `presentation.css`: diseño aislado de la vista resumida, con la misma paleta.
- `presentation.js`: cambio de vista y navegación animada entre diapositivas.

Secciones desarrolladas: **Sepsis**, **Datos**, **Preparación de los datos**, **Modelos**, **Entrenamiento**, **Evaluación y comparación** y **Conclusiones**. Cada sección termina con un enlace a la siguiente, salvo Conclusiones.

- `index.html`: estructura y contenido.
- `styles.css`: estructura visual y estilos adaptables.
- `theme.css`: paleta de azul petróleo (`#163344`), teal (`#0C756F`) y blanco frío (`#F5F8FA`), con tonos claros para superficies. Se carga después de los estilos de estructura.
- `app.js`: pestañas, selector de conjuntos y explorador de variables.
- `variable-details.js`: definiciones ampliadas y unidades publicadas, extraídas de `docs/data_dictionary.md`.
- `variable-tooltips.js`: ayuda flotante sobre el nombre o la descripción de cada variable, accesible con hover, foco de teclado o toque.
- `summarize_dictionary.py`: regenera únicamente `variable-details.js`, leyendo el diccionario original sin modificarlo.
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
python -B summarize_dictionary.py
```

Los recuentos y porcentajes se contrastaron con las salidas de `APPR_project/notebooks/exploration.ipynb`, especialmente las celdas de resumen de cohortes y comparación de faltantes. El porcentaje combinado se pondera por número de registros, no por número de pacientes.

Fuentes de contexto: ficha de sepsis de la OMS (2024, cifras globales referidas a 2017) y documentación oficial de PhysioNet/CinC 2019, enlazadas en la página.

En evaluación, la vista inicial compara las tres corridas completas entrenadas con A+B sobre prueba A+B. Los filtros permiten cambiar entrenamiento, etapa, partición y cohorte evaluada. La validación de las corridas completas con A contiene predicciones fuera de pliegue (CV de 3 pliegues); A+B usa holdout. El AP agrupado de validación cruzada se distingue de la media del AP por pliegue utilizada en selección. La comparación piloto/completo siempre utiliza la misma cohorte de prueba.

En entrenamiento se muestra el AP de referencia y el cociente entre el AP de selección y esa referencia. La referencia es la fracción de horas positivas de validación; en CV se promedia entre los mismos pliegues, a partir de las filas de `fold_metrics.csv` correspondientes al ensayo seleccionado.

Conclusiones sintetiza `APPR_project/docs/conclusiones_modelos.md` (revisión del 18 de noviembre de 2026): hallazgos, alcance clínico, limitaciones de optimización y arquitectura, explicabilidad por torre pendiente y prioridades de evaluación posterior.
