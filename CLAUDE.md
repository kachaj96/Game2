# Arena Iso (robocza nazwa Game2): izometryczna gra taktyczna w stylu Dofusa

Osobny projekt, nie część Natalis. Powstał na czas testów Natalis jako eksperyment: czy turowa walka na siatce izometrycznej daje frajdę. Gra po polsku. Testy: `npm test`. Podgląd grafiki: `npm start`, potem http://127.0.0.1:8080/.

## Kierunek (szczegóły i powody w `docs/PROJEKT.md`)
Hybryda w fazach: stały bohater i świat do eksploracji, Pogrzebana arena jako loch 5 do 6 komnat. Jedna osoba (z czasem współpraca przez internet z kodem pokoju), telefon i dotyk najpierw, ton poważniejszy i mroczniejszy. Fazy: 1 walka i klasy, 2 mała mapa, 3 zbieranie i crafting, 4 profesje. Klasy Grabarz, Tropiciel, Żałobnik zatwierdzone, groby jako wyróżnik, 6 PA i 3 PM.
- Logika gry mieszka w `src/game/`, jest deterministyczna i nie dotyka canvasa, DOM ani `Math.random()`. Zmiany stanu to komendy.
- Żadnej funkcji zależnej od najechania myszą: dotyk jest podstawą (pierwsze dotknięcie pokazuje podgląd, drugie potwierdza).
- Mroczny nastrój osiągamy oświetleniem i paletą (`src/art/mood.js`: `applyMood`, `glow`), nie zmianą kształtów.
- Gra działa tylko w poziomie (w pionie jest prośba o obrót). Walka: interfejs to nakładki na planszy, które nie mogą przechwytywać dotknięć (pointer-events:none dla kart informacyjnych). Zmiany układu sprawdzaj `npm run e2e` (emulacja telefonu i dotyku) i patrząc na `docs/podglad/walka*.png`.

- Klasy, czary, przeszłości i cechy to dane w `src/game/classdata.js` z testami spójności (np. każdy poziom czaru musi coś zmieniać). Nowa klasa = dane + wygląd w `src/art/classes.js` + testy. Klasy i wygląd zatwierdzone, liczby czarów do strojenia po walkach, patrz `docs/KLASY.md`.

## Zasada: grafika to generatory, nie pliki
Żadnych pobranych paczek ani obrazków. Wszystko rysuje kod na canvasie (`src/art/`).
- Każdy rodzaj obiektu (budynek, postać, roślina, rekwizyt) to para: `gen...(ziarno)` losuje specyfikację, `draw...(g, x, y, spec)` ją rysuje.
- Generator jest deterministyczny: to samo ziarno daje ten sam obiekt. Losować wolno tylko przez `rng(ziarno)` z `src/art/rng.js`, nigdy `Math.random()`.
- Dwa obiekty z różnych ziaren nie mogą być kopiami. Zmieniają się proporcje, materiały, kolory i wyposażenie, nie tylko kolor.
- Nowy rodzaj obiektu = nowy generator + wpis w `tests/unit/art.test.mjs` (deterministyczność, różnorodność, rysowanie bez NaN). Bez tego CI nie przejdzie.

## Zasady izometrii (po błędach z pierwszej wersji)
- Siatka żyje w `src/grid.js` (`IsoGrid`): `toScreen`, `toGrid`, `cellAt`, `center`, `corners`, blokady i sąsiedzi. To jedyne źródło prawdy o rzucie. Nie liczymy współrzędnych izometrii ręcznie w stronach ani w generatorach.
- Budynek stoi na pełnych kaflach (`w`, `d` całkowite). Jego róg S leży w punkcie siatki `(sx,sy)`, a zajęte komórki zwraca `footprintCells`. Dzięki temu logika (blokady, A*) zgadza się z tym, co widać.
- Geometrię dachu liczymy w siatce (`buildingGeometry`), nie w przestrzeni ekranu. Skalowanie okapu na ekranie odklejało dach od murów i budynek "wisiał w powietrzu". Test `building-geometry.test.mjs` pilnuje, żeby szczyt, kalenica i okap leżały w jednej płaszczyźnie z murem.
- Wszystko, co wisi na ścianie albo leży w świecie, rysujemy w płaszczyźnie ściany albo w osiach izometrii: `plane('L'|'R', x, y)`, `planeEllipse`, `isoBox`, `isoCylinder` z `src/art/kit.js`. Nigdy płaskie koło lub prostokąt wprost na ekran (okienko w szczycie, lukarna, szyld, lampa, ława, wóz, kłody). Wyjątek: postacie i rośliny, które są billboardami.
- Budynek musi mieć kontakt z gruntem: wydeptana ziemia pod podstawą, cień, ciemniejszy pas przy murze, kępki trawy.

## Styl graficzny
- Równy ciemnobrązowy kontur (`OUT` z `src/art/kit.js`), nasycone kolory, gradienty zamiast płaskich wypełnień, światło z lewej góry (lewa ściana ciemniejsza, prawa jaśniejsza).
- Rzut izometryczny 2:1, kafel `TW=72`, `TH=36` (`src/grid.js`). Punkt (X,Y) budynku to jego przedni dolny róg.
- Postacie mają 4 kierunki: SE i NE rysowane wprost, SW i NW to lustro. Chód to parametr `t` od 0 do 1.
- Na planszy walki liczy się czytelność: siatka musi być widoczna, przeszkody niskie albo wyraźnie oznaczone. Pierścienie pod postaciami: niebieski sojusznik, czerwony wróg.
- Stary styl atramentowy z Natalis (drżąca kreska, pergamin) w tym projekcie nie jest używany.

## Praca
- Pracujemy na `main`, commity małe i opisowe po polsku.
- Każdy commit kończ liniami `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` i `Claude-Session: ...`.
- Zmiany grafiki sprawdzaj wzrokiem: `npm run shots` robi zrzuty do `docs/podglad/` (wymaga `npm i`). Sam test z atrapą canvasu nie zobaczy, że dom wygląda źle.
- Styl wypowiedzi do autora: bezpośrednio, bez wodolejstwa i myślników w tekstach, mentor mode przy ocenie pomysłów.
