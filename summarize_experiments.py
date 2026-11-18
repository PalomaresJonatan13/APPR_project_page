"""Read saved runs without modifying the project; export aggregate page data only."""
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent / 'APPR_project' / 'final_runs'
ARCHITECTURES = {'semantic_grud_3', 'semantic_grud', 'vs_gru'}
METRICS = ('source', 'patients', 'hours', 'positive_hours', 'positive_hour_fraction',
           'average_precision', 'auroc', 'utility', 'alert_fraction',
           'recall_at_threshold', 'threshold')


def read_csv(path):
    with path.open(encoding='utf-8', newline='') as handle:
        return list(csv.DictReader(handle))


def metric(row):
    return {key: row[key] if key == 'source' else
            int(row[key]) if key in ('patients', 'hours', 'positive_hours') else
            float(row[key]) for key in METRICS}


def main():
    test = defaultdict(list)
    for row in read_csv(ROOT / 'test_results' / 'metrics.csv'):
        test[row['run']].append(metric(row))
    manifest = {row['run']: row for row in json.loads((ROOT / 'test_results' / 'manifest.json').read_text(encoding='utf-8'))}
    runs = []
    for path in sorted(ROOT.glob('*/config.json')):
        config = json.loads(path.read_text(encoding='utf-8'))
        if config['architecture'] not in ARCHITECTURES:
            continue
        trials = read_csv(path.parent / 'trials.csv')
        selected = next(row for row in trials if int(row['trial']) == config['best_trial'])
        selected_folds = [row for row in read_csv(path.parent / 'fold_metrics.csv')
                          if int(row['trial']) == config['best_trial'] and row['source'] == 'all']
        reference_ap = sum(float(row['positive_hour_fraction']) for row in selected_folds) / len(selected_folds)
        split_counts = Counter()
        patients = set()
        for row in read_csv(path.parent / 'splits.csv'):
            split_counts[(row['fold'], row['partition'])] += 1
            patients.add(row['patient_id'])
        record = {key: config.get(key) for key in (
            'architecture', 'source', 'sample_patients', 'folds', 'validation_fraction',
            'seed', 'epochs', 'patience', 'trials', 'best_trial', 'fitted_epochs', 'search',
            'hyperparameters')}
        record.update(id=path.parent.name, stage='pilot' if config['sample_patients'] else 'full',
                      development_patients=len(patients),
                      first_fold_train=split_counts[('1', 'train')],
                      first_fold_validation=split_counts[('1', 'validation')],
                      completed_trials=sum(row.get('state', 'COMPLETE') == 'COMPLETE' for row in trials),
                      pruned_trials=sum(row.get('state') == 'PRUNED' for row in trials),
                      selection_ap=float(selected['mean_validation_ap']),
                      selection_ap_std=float(selected['std_validation_ap']),
                      reference_ap=reference_ap,
                      validation=[metric(row) for row in read_csv(path.parent / 'validation_metrics.csv')],
                      test=test[path.parent.name])
        assert manifest[record['id']]['status'] == 'complete'
        assert manifest[record['id']]['test_development_overlap_patients'] == 0
        assert {row['source'] for row in record['test']} == {'all', 'A', 'B'}
        runs.append(record)
    assert len(runs) == 12
    assert len({(row['architecture'], row['source'], row['stage']) for row in runs}) == 12
    reference = {row['source']: row for row in runs[0]['test']}
    for run in runs:
        for row in run['test']:
            assert all(row[key] == reference[row['source']][key]
                       for key in ('patients', 'hours', 'positive_hours'))
    result = {'runs': runs, 'test_cohorts': reference, 'overlap_patients': 0}
    (HERE / 'experiment-data.js').write_text('window.EXPERIMENT_DATA = ' + json.dumps(result, ensure_ascii=False, allow_nan=False) + ';\n', encoding='utf-8')
    print(f'Exported {len(runs)} runs, {sum(len(r["test"]) for r in runs)} test rows; cohorts agree across all runs.')
    for run in runs:
        print(run['architecture'], run['source'], run['stage'], run['development_patients'],
              run['first_fold_train'], run['first_fold_validation'], 'selected_epoch', run['fitted_epochs'])


if __name__ == '__main__':
    main()
