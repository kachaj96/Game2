# Mapy v3: specyfikacja (etap 0)

Nowy potok map: podłoże + osobne obiekty (PNG) + dane. Gra z kodu (Natalis-styl generatorów) zostaje nietknięta. Ten dokument to umowa: grafika powstaje pod niego, silnik i edytor też. Liczby oznaczone (?) zatwierdzamy w pilocie na 5 obiektach.

## 1. Rzut i jednostki
- Prawdziwa izometria: krawędzie podstaw pod kątem 30 stopni, nachylenie 0,577 (generatory obrazów rysują właśnie ten rzut, nie 2:1). Kafel na ekranie: 72 x 42 j (jednostek logicznych). Gra z kodu zostaje przy 2:1 (72 x 36), te mapy mają własną siatkę.
- Pliki PNG rysujemy w skali 2x: kafel ma 144 x 84 px w pliku. Gra skaluje do jednostek, więc telefon z DPR 2 dostaje ostry obraz bez przeliczania.
- Wysokość: 1 poziom = 42 j (wysokość kafla). Wysokości w danych są liczbami całkowitymi poziomów, 0 to grunt.
- Pozycje w danych zawsze w kaflach (x, y, poziom), nigdy w pikselach ekranu. Piksele liczy tylko `IsoGrid`.

## 2. Światło
- Jedno stałe światło z prawej góry. Prawa ściana jasna, lewa ciemna (w cieniu), góra najjaśniejsza. Cień rzucony pada w lewo i w stronę widza. (Pierwsze wersje promptów mówiły "z lewej góry" przy jasnej prawej ścianie, co się wykluczało. Obrazy pilota są jasne z prawej, więc to jest obowiązujący kierunek.)
- Sprite NIE ma cienia na ziemi i nie ma poświaty wokół. Cień rzuca silnik, jednym kierunkiem dla wszystkich (spłaszczona sylwetka skośnie w lewo i w dół), więc zgadza się też na różnych wysokościach.
- Brak cyklu dnia na tych mapach. Mapy w zamkniętych miejscach różnią się paletą, nie kierunkiem światła.

## 3. Skala (?)
Wysokości w j, w pliku PNG razy 2.
| Rzecz | Odcisk (kafle) | Wysokość |
|---|---|---|
| Bohater | 1x1 (stoi w punkcie) | 64 j |
| Drzwi | | 56 j |
| Skrzynia, beczka | 1x1 | 24 do 30 j |
| Studnia | 1x1 | 44 j |
| Lampa | 1x1 | 120 j |
| Chata (jedna kondygnacja) | 3x3 | ściana 72 j, szczyt dachu 140 j |
| Drzewo | 1x1 | pień 12 j, korona do 200 j |
| Mur, ogrodzenie | 1x1 segment | 36 do 48 j |
Granica: obiekt wyższy niż 4 poziomy (144 j) dostaje flagę zanikania, bo zasłania bohatera.

## 4. Obiekt: dane
Każdy PNG w bibliotece ma obok `<id>.json`:
- `anchor`: punkt kotwicy w pikselach pliku. To przedni dolny róg odcisku (punkt S, jak róg budynku w `buildings.js`).
- `footprint`: `{w, d}` w pełnych kaflach. Z niego liczy się kolizja, nie z kształtu obrazu. Opcjonalnie `block`: lista kafli odcisku, które są wolne (np. łuk bramy), żeby nie blokować przejścia pod nim.
- `height`: wysokość w poziomach (ułamek dozwolony), do sortowania i cienia.
- `sort`: domyślnie przednia krawędź odcisku. Własna linia tylko dla wyjątków (most, schody).
- `fade`: czy zanika, gdy bohater jest za nim, i która część (`sil`: sylwetka lub cały obiekt).
- `interact`: opcjonalnie `{type, spot, label}`: `spot` to kafel, z którego można użyć (np. przed drzwiami).
- `shadow`: `true` domyślnie. Wyłączane dla rzeczy płaskich (dywan, kałuża).

## 5. Sortowanie głębi
- Klucz: `x + y` przedniego rogu odcisku (większy = bliżej widza), potem poziom, potem `x`.
- Bohater sortuje się swoją pozycją. Kafel nie ma osobnej logiki "za/przed": decyduje klucz.
- Ręczne przesunięcie warstwy to tylko pole `sortBias` na instancji obiektu, dla wyjątków. Jeśli zdarza się często, błąd jest w odcisku, nie w sortowaniu.

## 6. Podłoże (rozstrzygnięte: obraz na mapę)
Dwie drogi, sprawdzamy obie na jednym małym kawałku:
- A) Tileset: romby 144 x 72 px, kilka wariantów na rodzaj (trawa, ziemia, kamień, woda...), przejścia jako osobne romby. Reużywalny, lekki dla pamięci, ale generator ma kłopot z bezszwowymi rombami.
- B) Obraz podłoża na mapę, bez obiektów, cięty w grze na kawałki 512 px. Spójny wygląd, ale każdy nowy teren to nowy obraz.
Decyzja po pilocie. Kolizja z podłoża nie wynika: wolne/blokowane pola ustawia mapa.

## 7. Wysokości w mapie
- Mapa ma tablicę poziomów na kafel. Różnica między sąsiadami: 0 (płasko), 1 (wolno wejść tylko po rampie lub schodach), 2 i więcej (klif, ściana).
- Rampa i schody to obiekty z `ramp: {from, to, dir}`: wolno po nich przejść między poziomami. Reszta zmian wysokości blokuje ruch.
- Klif rysujemy osobnym sprite'em ściany (segment 1 kafel x N poziomów), nie próbujemy wycinać go z podłoża.
- Postać na poziomie n jest przesunięta na ekranie o n x 36 j w górę.

## 8. Wymagania dla PNG od generatora
- Prawdziwa przezroczystość (alfa). Jeśli generator rysuje szachownicę, generujemy na jednolitym tle `#FF00FF` i usuwamy je w narzędziu (etap 3), czego nie robimy ręcznie.
- Bez cienia pod obiektem, bez winiety, bez rozmycia krawędzi, bez ramki. Ostra, czysta krawędź.
- Margines 8 px od brzegu pliku na każdej stronie. Obiekt cały w kadrze.
- Ta sama izometria 30 stopni i światło z prawej góry. Rzut patrzy z przodu: widać górę, lewą i prawą ścianę.
- Rozmiar: do 1024 px po dłuższym boku (w skali 2x). Jeden obiekt na plik.
- Nazwa pliku: `<kategoria>_<opis>_<nr>.png` (np. `dom_chata_01.png`).

## 9. Szablon promptu dla obiektu
```
True isometric (30 degrees) game asset, single object: {OPIS}.
View from front, camera 30 degrees, the object seen from above showing the top, the left face (darker, in shade) and the right face (lighter, lit). Light from the top-right.
Dark gothic fantasy, muted saturated colors, painterly hand-painted look, dark brown outline.
Object stands on a footprint of {W}x{D} tiles. Show only the object, no ground, no cast shadow, no vignette, no blur.
Solid flat magenta background #FF00FF, crisp edges, 8px margin, centered.
```

## 10. Test akceptacji sprite'a (pilot)
1. Rzut zgadza się z siatką: krawędzie podstawy mają nachylenie około 0,58 (tolerancja plus minus 0,1; do 0,2 tylko dla drobnych rekwizytów).
2. Skala zgadza się z tabelą (z tolerancją 10%) względem bohatera.
3. Odcisk da się wyznaczyć jednoznacznie (podstawa jest czytelna).
4. Krawędź czysta po usunięciu tła, bez kolorowych obwódek.
5. Światło z prawej góry (prawa ściana jasna, lewa ciemna), spójne z resztą biblioteki.

Automat: `mapy/sprawdz.html` (otwierasz z pliku lub przez `npm start`, przeciągasz PNG, wybierasz rodzaj, odcisk i wysokość). Liczy punkty 1 do 4 (skala jako proporcje i współczynnik skalowania) oraz alfę, margines, rozmiar, cień, obwódkę, a dla podłoża winietę, ostrość i rozdzielczość. Światło (5) tylko orientacyjnie. Kod: `mapy/src/pngcheck.js`, testy `tests/unit/pngcheck.test.mjs`.

## 11. Otwarte
- Czy bohater i NPC też przechodzą na PNG, czy zostają z generatora (domyślnie: zostają).
- Wielkość mapy: jedna mapa to jeden prostokątny ekran, czyli jeden obraz podłoża (do 1536 x 1024 z generatora), z siatką kafli przyciętą do prostokąta (jak w Dofusie), około 10 do 14 kafli szerokości. Większe mapy zszywamy z kilku obrazów dopiero w razie potrzeby.
- Przejście do sąsiedniej mapy: strefa na krawędzi (zestaw kafli) z danymi `{mapa, kafel startu}`. Wchodzisz w strefę i jesteś przenoszony od razu, bez przycisku. Strefy i cele wyznacza autor w edytorze.

## 12. Szablony geometrii dla generatora
`mapy/szablony/*.png` (tworzone przez `tools/make_szablony.py`): szara bryła w izometrii 30 stopni z odciskiem i sylwetką bohatera dla skali. Wgrywasz szablon do generatora jako obraz referencyjny i prosisz o przemalowanie dokładnie tego kształtu. Drugim obrazem dajesz wzorzec stylu (Twój najlepszy dotychczasowy obraz).

## 13. Postacie (bohater, NPC, zwierzęta, wrogowie)
- Postać to billboard: sprite stoi na jednym kaflu, 64 j wysokości dla człowieka (128 px w pliku 2x), kotwica pod stopami.
- Rysujemy tylko dwa kierunki: SE (twarzą do widza, w prawo) i NE (tyłem, w prawo). SW i NW to lustro SE i NE, jak w grze z kodu.
- Chód: klatki cyklu (docelowo 6 do 8 klatek na kierunek), stały rozmiar klatki, kotwica w tym samym punkcie.
- Test pilota: jeden bohater (Grabarz) w dwóch kierunkach na jednym arkuszu, sprawdzamy czy to ta sama postać i czy skala jest ta sama.

## 14. Przejścia między mapami (zrobione)
- Przejście to zestaw kafli na mapie z celem `{map, x, y}`, gdzie `x, y` to kafel startu w mapie docelowej. Dane w `maps/<id>.json`, lista map w `maps/index.json`.
- Wejście bohatera w kafel strefy przenosi go od razu (zanikanie ekranu), bez przycisku. Po przybyciu strefa jest zablokowana, dopóki bohater z niej nie zejdzie, więc nie ma odbijania tam i z powrotem.
- Walidacja świata (`src/swiat.js`): cel istnieje i jest wolnym kaflem, cel nie leży w strefie przejścia, mapa docelowa ma przejście z powrotem, każda mapa jest osiągalna z mapy startowej.
- Edytor: wybór mapy, tworzenie nowej, cel przejścia wybierany z listy lub kliknięciem kafla na mapie docelowej, "Kopiuj świat" kopiuje wszystkie mapy naraz.
