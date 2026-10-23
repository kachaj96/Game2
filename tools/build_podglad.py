# Składa mapy/podglad.html w jeden plik (moduły i grafiki wewnątrz), do publikacji jako artefakt albo otwarcia bez serwera.
import base64, json, os, re, sys
R = os.path.join(os.path.dirname(__file__), '..', 'mapy'); out = sys.argv[1]
page = open(os.path.join(R, 'podglad.html'), encoding='utf-8').read()
lib = json.load(open(os.path.join(R, 'gra', 'biblioteka.json')))
files = [lib['ground']['file'], lib['hero']['idle_sw']['file'], lib['hero']['idle_ne']['file']] + [f['file'] for f in lib['hero']['walk_w']] + [s['file'] for s in lib['sprites'].values()]
mime = lambda f: 'image/jpeg' if f.endswith('.jpg') else 'image/png'
assets = {f: 'data:%s;base64,%s' % (mime(f), base64.b64encode(open(os.path.join(R, 'gra', f), 'rb').read()).decode()) for f in files}
def strip(src): return re.sub(r'^import .*?;\s*$', '', re.sub(r'^export ', '', src, flags=re.M), flags=re.M)
iso = strip(open(os.path.join(R, 'src', 'iso.js'), encoding='utf-8').read()); md = strip(open(os.path.join(R, 'src', 'mapdata.js'), encoding='utf-8').read())
head = '<script>window.__LIB=%s;window.__ASSETS=%s;</script>\n' % (json.dumps(lib), json.dumps(assets))
page = re.sub(r"^import \{.*?\} from '\./src/(iso|mapdata)\.js';\n", '', page, flags=re.M)
page = page.replace('<script type="module">', head + '<script type="module">\n' + iso + '\n' + md + '\n', 1)
open(out, 'w', encoding='utf-8').write(page); print(out, round(len(page) / 1e6, 2), 'MB')
