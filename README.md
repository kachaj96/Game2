# Arena Iso (robocza nazwa Game2)

Izometryczna taktyczna gra turowa w stylu Dofusa. Osobny projekt, nie część Natalis. Eksperyment na czas testów Natalis.

## Stan
Gotowe: grafika, siatka izometryczna (`src/grid.js`), logika ruchu i tur (`src/game/`: A*, zasięg PM, komendy, kolejka, prosta sztuczna inteligencja) i prototyp walki na dotyk (`www/walka.html`). Czary: działają obrażenia, zasięg, linia widzenia, odnowienia, limity na turę, śmierć i groby, odpychanie z kolizją i chmury popiołu (Żar, Cios Łopatą, Bełt, Zrzut Ziemi, Podmuch Popiołu). Pułapki i glify jeszcze nie, takie czary są w grze wyszarzone z podpisem "wkrótce". Nie ma jeszcze nagród ani pętli zejścia do areny.

| Co | Gdzie | Co umie |
|---|---|---|
| Klasy | `src/game/classdata.js`, `src/art/classes.js` | PROPOZYCJA: Grabarz, Tropiciel, Żałobnik. 3 czary po 5 poziomów, kreator postaci. Szczegóły w `docs/KLASY.md` |
| Siatka | `src/grid.js` | `IsoGrid`: ekran <-> siatka, komórka pod kursorem, blokady, sąsiedzi, głębokość do sortowania |
| Budynki | `src/art/buildings.js` | 6 rodzajów (chata, kamienica, karczma, sklep, wieża, gospodarstwo), losowe materiały, dachy, balkony, markizy, szyldy |
| Postacie | `src/art/characters.js` | 7 ról, fryzury, stroje, broń, 4 kierunki, chód w klatkach |
| Przyroda | `src/art/nature.js` | dąb, sosna, brzoza, martwe drzewo, krzewy, skały, kwiaty, grzyby, staw, drogi, 5 biomów |
| Rekwizyty | `src/art/props.js` | beczka, skrzynia, stos kłód, ławka, bela siana, latarnia, wóz |

Wszystko rysuje kod, bez plików graficznych. Każdy obiekt ma ziarno, więc ta sama liczba daje ten sam obiekt, a inna liczba inny.

![wioska](docs/podglad/wioska.png)

## Gra w przeglądarce (GitHub Pages)
Settings, Pages, Source: Deploy from a branch, Branch: main, folder: / (root). Adres: `https://kachaj96.github.io/Game2/`. Walka: `www/walka.html` (najlepiej w poziomie). Pasek z wieloma czarami: `?spells=all` (5 czarów testowych z innych żywiołów). Ze scenariuszami: `?scenario=cast`, `?scenario=push&hero=grabarz`, `?hero=tropiciel`, `?mood=zmierzch`.

## Uruchomienie
```
npm test          # testy jednostkowe (Node 22, bez zależności)
npm start         # podgląd na http://127.0.0.1:8080/ (walka: /www/walka.html, najlepiej w poziomie, ?mood=zmierzch lub dzien)
npm run e2e       # testy w przeglądarce z emulacją telefonu i dotyku: walka, kreator, czary (wymaga npm i)
npm i && npm run shots   # zrzuty do docs/podglad (Playwright)
```

## Kierunek
Serie aren w stylu roguelite, jedna osoba (z czasem współpraca w jednej sieci), telefon i dotyk najpierw, ton poważniejszy i mroczniejszy. Decyzje i ryzyka: [docs/PROJEKT.md](docs/PROJEKT.md).

## Plan
1. ~~Siatka logiczna i rzut izometryczny~~ (zrobione, z testami odwracalności).
2. ~~Ruch po kaflach: A*, punkty ruchu, przeszkody~~ (zrobione, 36 testów jednostkowych plus test w przeglądarce z emulacją telefonu).
3. Tury: kolejka, PA/PM, jeden czar z zasięgiem i linią widzenia.
4. Jedna grywalna arena. Dopiero wtedy decyzja, czy iść dalej.
5. Animacje ataku i trafienia (dziś jest tylko chód), cache sprite'ów do offscreen canvasów.

Nieprzetestowane: wydajność rysowania wielu obiektów w czasie rzeczywistym. Generatory są drogie, więc wynik trzeba cache'ować, zamiast rysować od nowa co klatkę.
