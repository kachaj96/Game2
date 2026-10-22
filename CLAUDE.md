# Arena Iso (robocza nazwa Game2): izometryczna gra taktyczna w stylu Dofusa

Osobny projekt, nie część Natalis. Powstał na czas testów Natalis jako eksperyment: czy turowa walka na siatce izometrycznej daje frajdę. Gra po polsku. Testy: `npm test`. Podgląd grafiki: `npm start`, potem http://127.0.0.1:8080/.

## Zasada: grafika to generatory, nie pliki
Żadnych pobranych paczek ani obrazków. Wszystko rysuje kod na canvasie (`src/art/`).
- Każdy rodzaj obiektu (budynek, postać, roślina, rekwizyt) to para: `gen...(ziarno)` losuje specyfikację, `draw...(g, x, y, spec)` ją rysuje.
- Generator jest deterministyczny: to samo ziarno daje ten sam obiekt. Losować wolno tylko przez `rng(ziarno)` z `src/art/rng.js`, nigdy `Math.random()`.
- Dwa obiekty z różnych ziaren nie mogą być kopiami. Zmieniają się proporcje, materiały, kolory i wyposażenie, nie tylko kolor.
- Nowy rodzaj obiektu = nowy generator + wpis w `tests/unit/art.test.mjs` (deterministyczność, różnorodność, rysowanie bez NaN). Bez tego CI nie przejdzie.

## Styl graficzny
- Równy ciemnobrązowy kontur (`OUT` z `src/art/kit.js`), nasycone kolory, gradienty zamiast płaskich wypełnień, światło z lewej góry (lewa ściana ciemniejsza, prawa jaśniejsza).
- Rzut izometryczny 2:1, kafel `TW=72`, `TH=36` (`src/art/buildings.js`). Punkt (X,Y) budynku to jego przedni dolny róg.
- Postacie mają 4 kierunki: SE i NE rysowane wprost, SW i NW to lustro. Chód to parametr `t` od 0 do 1.
- Na planszy walki liczy się czytelność: siatka musi być widoczna, przeszkody niskie albo wyraźnie oznaczone. Pierścienie pod postaciami: niebieski sojusznik, czerwony wróg.
- Stary styl atramentowy z Natalis (drżąca kreska, pergamin) w tym projekcie nie jest używany.

## Praca
- Pracujemy na `main`, commity małe i opisowe po polsku.
- Każdy commit kończ liniami `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` i `Claude-Session: ...`.
- Zmiany grafiki sprawdzaj wzrokiem: `npm run shots` robi zrzuty do `docs/podglad/` (wymaga `npm i`). Sam test z atrapą canvasu nie zobaczy, że dom wygląda źle.
- Styl wypowiedzi do autora: bezpośrednio, bez wodolejstwa i myślników w tekstach, mentor mode przy ocenie pomysłów.
