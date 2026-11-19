"""Copy the project's variable definitions into a static page asset (read-only source)."""
import json
import re
from pathlib import Path

here = Path(__file__).resolve().parent
source = here.parent / 'APPR_project' / 'docs' / 'data_dictionary.md'
details = {}
for line in source.read_text(encoding='utf-8').splitlines():
    match = re.match(r'^\| `([^`]+)` \| ([^|]+) \| (.+) \|$', line)
    if match and match[1] != 'SepsisLabel':
        clean = lambda text: text.replace('**', '').replace('`', '').strip()
        details[match[1]] = {'unit': clean(match[2]), 'description': clean(match[3])}
assert len(details) == 40, 'Expected one definition for each of the 40 predictors.'
(here / 'variable-details.js').write_text(
    'window.VARIABLE_DETAILS = ' + json.dumps(details, ensure_ascii=False) + ';\n', encoding='utf-8')
print(f'Exported {len(details)} variable definitions from {source.name}.')
