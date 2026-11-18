"""Read original project CSVs; write only aggregate statistics beside this script."""
import csv
import json
from pathlib import Path
from statistics import median

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'APPR_project' / 'data' / 'csv'


def summarize(name):
    patients = {}
    with (SOURCE / f'set_{name}.csv').open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        features = reader.fieldnames[:40]
        missing = dict.fromkeys(features, 0)
        rows = positive_hours = 0
        for row in reader:
            rows += 1
            positive = int(float(row['SepsisLabel']))
            positive_hours += positive
            patient = patients.setdefault(row['patient_id'], [0, 0])
            patient[0] += 1
            patient[1] = max(patient[1], positive)
            for feature in features:
                missing[feature] += row[feature].strip().lower() in ('nan', '')
    return dict(patients=len(patients), sepsis_patients=sum(p[1] for p in patients.values()),
                rows=rows, positive_hours=positive_hours,
                median_hours=median(p[0] for p in patients.values()), missing=missing)


if __name__ == '__main__':
    result = {name: summarize(name) for name in ('A', 'B')}
    result['all'] = {key: sum(result[name][key] for name in ('A', 'B'))
                     for key in ('patients', 'sepsis_patients', 'rows', 'positive_hours')}
    result['all']['missing'] = {key: result['A']['missing'][key] + result['B']['missing'][key]
                                for key in result['A']['missing']}
    (HERE / 'data-summary.js').write_text('window.DATA_SUMMARY = ' + json.dumps(result, ensure_ascii=False) + ';\n', encoding='utf-8')
    print(json.dumps({name: {k: v for k, v in values.items() if k != 'missing'}
                      for name, values in result.items()}, indent=2))
