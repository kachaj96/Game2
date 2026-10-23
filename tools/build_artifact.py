# Składa wielo-plikowy artefakt ze strony www/: strona (style i ui.css wstawione) + moduły src/ idące po importach.
# Użycie: python3 tools/build_artifact.py <strona.html z www/> <katalog_wyjsciowy> [domyslne_query]. Wypisuje listę plików do publikacji.
import os, re, shutil, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); page_name, out = sys.argv[1], sys.argv[2]; query = sys.argv[3] if len(sys.argv) > 3 else ''
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
page = open(os.path.join(ROOT, 'www', page_name), encoding='utf-8').read()
css = open(os.path.join(ROOT, 'www', 'ui.css'), encoding='utf-8').read() if 'ui.css' in page else ''
style = ''.join(re.findall(r'<style>(.*?)</style>', page, re.S)) + '\n' + css
body = re.search(r'<body>(.*)</body>', page, re.S).group(1).replace("'../src/", "'./src/").replace('"../src/', '"./src/')
if query: body = body.replace('new URLSearchParams(location.search)', "new URLSearchParams(location.search||'%s')" % query)
title = re.search(r'<title>(.*?)</title>', page).group(1)
open(os.path.join(out, 'strona.html'), 'w', encoding='utf-8').write('<title>%s</title>\n<style>%s</style>\n%s' % (title, style, body))
files = set()
def walk(rel):
    if rel in files: return
    files.add(rel); dst = os.path.join(out, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(os.path.join(ROOT, rel), dst)
    for m in re.findall(r"from '(\.[^']+)'", open(os.path.join(ROOT, rel), encoding='utf-8').read()): walk(os.path.normpath(os.path.join(os.path.dirname(rel), m)))
for m in re.findall(r"from '\./(src/[^']+)'", body): walk(m)
print('\n'.join(sorted(files)))
