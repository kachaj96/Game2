# Składa stronę z mapy/ (podglad.html albo edytor.html) w jeden plik: moduły, grafiki i mapy wewnątrz.
# Użycie: python3 tools/build_single.py podglad.html wyjscie.html
# Do publikacji jako artefakt (opcja --artefakt zdejmuje ramkę html/head/body).
import base64, glob, json, os, re, sys
R = os.path.join(os.path.dirname(__file__), '..', 'mapy'); page_name, out = sys.argv[1], sys.argv[2]; artifact = '--artefakt' in sys.argv
page = open(os.path.join(R, page_name), encoding='utf-8').read()
lib = json.load(open(os.path.join(R, 'gra', 'biblioteka.json')))
files = [lib['ground']['file'], lib['hero']['idle_sw']['file'], lib['hero']['idle_ne']['file']] + [f['file'] for f in lib['hero']['walk_w']] + [s['file'] for s in lib['sprites'].values()]
mime = lambda f: 'image/jpeg' if f.endswith('.jpg') else 'image/png'
assets = {f: 'data:%s;base64,%s' % (mime(f), base64.b64encode(open(os.path.join(R, 'gra', f), 'rb').read()).decode()) for f in files}
maps = {os.path.basename(p)[:-5]: json.load(open(p, encoding='utf-8')) for p in glob.glob(os.path.join(R, 'maps', '*.json')) if not p.endswith('index.json')}
def strip(src): return re.sub(r'^import .*?;\s*$', '', re.sub(r'^export ', '', src, flags=re.M), flags=re.M)
mods = '\n'.join(strip(open(os.path.join(R, 'src', n + '.js'), encoding='utf-8').read()) for n in ('iso', 'mapdata', 'osadzenie', 'walidacja', 'swiat', 'scena'))
head = '<script>window.__LIB=%s;window.__ASSETS=%s;window.__MAPS=%s;window.__INDEX=%s;</script>\n' % (json.dumps(lib), json.dumps(assets), json.dumps(maps), json.dumps(json.load(open(os.path.join(R, 'maps', 'index.json')))['start']))
page = re.sub(r"^import \{.*?\} from '\./src/\w+\.js';\n", '', page, flags=re.M)
page = page.replace('<script type="module">', head + '<script type="module">\n' + mods + '\n', 1)
if artifact:
    page = re.sub(r'<a id="ed"[^>]*>.*?</a>', '', page)
    style = re.search(r'<style>.*?</style>', page, re.S).group(0); body = re.search(r'<body>(.*)</body>', page, re.S).group(1); title = re.search(r'<title>(.*?)</title>', page).group(1)
    page = '<title>%s</title>\n%s\n%s' % (title, style, body)
open(out, 'w', encoding='utf-8').write(page); print(out, round(len(page) / 1e6, 2), 'MB')
