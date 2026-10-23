# Składa wielo-plikowy artefakt z walką na mapie v3: strona główna (walka-v3.html) + moduły src/ i mapy/ + grafiki.
# Użycie: python3 tools/build_walka_artifact.py <katalog_wyjsciowy>. Wypisuje listę plików do publikacji.
import os, re, shutil, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); out = sys.argv[1]
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
page = open(os.path.join(ROOT, 'www', 'walka.html'), encoding='utf-8').read()
css = open(os.path.join(ROOT, 'www', 'ui.css'), encoding='utf-8').read()
style = ''.join(re.findall(r'<style>(.*?)</style>', page, re.S)) + '\n' + css
body = re.search(r'<body>(.*)</body>', page, re.S).group(1)
body = body.replace("'../src/", "'./src/").replace("'../mapy/", "'./mapy/").replace('"../src/', '"./src/')
# artefakt nie ma adresu z parametrami: domyślnie komnata lochu Korytarze na mapie v3
body = body.replace('const Q=new URLSearchParams(location.search)', "const Q=new URLSearchParams(location.search||'?dungeon=korytarze&level=3&seed=7')")
# artefakt zawsze otwiera test v3
body = body.replace("const V3=Q.get('v3')==='1';", "const V3=Q.get('v3')!=='0';")
open(os.path.join(out, 'walka-v3.html'), 'w', encoding='utf-8').write('<title>Walka na mapie v3</title>\n<style>' + style + '</style>\n' + body)
files = {'walka-v3.html'}
def walk(rel):   # rel: ścieżka względem ROOT, np. src/art/kit.js
    if rel in files: return
    files.add(rel); dst = os.path.join(out, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(os.path.join(ROOT, rel), dst)
    for m in re.findall(r"from '(\.[^']+)'", open(os.path.join(ROOT, rel), encoding='utf-8').read()):
        walk(os.path.normpath(os.path.join(os.path.dirname(rel), m)))
for m in re.findall(r"from '\./(src/[^']+|mapy/[^']+)'", body): walk(m)
for f in os.listdir(os.path.join(ROOT, 'mapy', 'gra')):
    rel = 'mapy/gra/' + f; dst = os.path.join(out, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(os.path.join(ROOT, rel), dst); files.add(rel)
print('\n'.join(sorted(files)))
