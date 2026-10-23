# Pilotaż: obrazy generowane w grze

Cel: sprawdzić, czy 15 obiektów i jedno tło areny w jednym stylu trzymają się razem w grze, zanim zainwestujemy w setki zasobów. Reszta (teren, cienie, światło, postacie) zostaje w kodzie.

## 1. Biblia stylu (wklej na początku KAŻDEGO promptu)
> Dark fantasy 2D isometric game asset, hand-painted digital illustration, thick dark-brown outline around the silhouette, rich textured surfaces (weathered wood, rough stone, moss), muted earthy palette with warm amber highlights, slightly desaturated. Isometric 2:1 projection (camera 30 degrees above horizon), object seen from the front-right, key light from the top-left, soft shadows inside the object only. Single object, centered with a small margin, fully transparent background, NO ground, NO cast shadow, NO text, NO glow or vignette around the object. 1536x1024 PNG.

Dodaj na końcu: `Subject: <opis obiektu>`. Do generatora podawaj jako obraz referencyjny trzy dotychczasowe (beczka, krypta, dąb), żeby kolejne pasowały do tych samych kolorów i kreski.

Częste błędy do sprawdzenia przed importem: widoczna poświata albo cień pod obiektem (usuwa je import, ale lepiej nie mieć), zła perspektywa (widok z góry albo z boku zamiast izometrii), kontur innej grubości niż w referencjach, obiekt ucięty na brzegu.

## 2. Lista pilotażu (15 pozycji)
Rozmiar w grze to piksele świata (bohater ma 62 px wysokości, patrz `docs/pilot/szablon-skali.png`). Import skaluje plik do 7 pikseli na piksel świata.

| # | Klucz | Opis (Subject) | Szerokość w grze |
|---|---|---|---|
| 1 | `sosna` | tall dark pine tree, layered drooping branches | 90 |
| 2 | `brzoza` | slim birch tree with pale bark, light green leaves | 80 |
| 3 | `martwe` | dead leafless twisted tree, grey bark | 90 |
| 4 | `glaz` | large mossy boulder cluster, grey rock with cracks | 70 |
| 5 | `krzew` | dense green shrub with a few berries | 44 |
| 6 | `skrzynia` | iron-banded wooden crate, weathered | 28 |
| 7 | `latarnia` | wrought-iron street lamp with a glowing amber lantern, stone base | 24 |
| 8 | `studnia` | stone village well with a small wooden roof and bucket | 52 |
| 9 | `chata` | small village cottage, timber frame, thatched roof, chimney | 150 |
| 10 | `jama` | gaping cave mouth under giant tree roots, cobwebs, glowing eggs, dark | 190 |
| 11 | `nagrobek` | weathered stone gravestone with a cross, moss | 30 |
| 12 | `pniak` | tree stump with axe marks and mushrooms | 36 |
| 13 | `przeszkoda1` | pile of rubble and broken stone slab (arena obstacle, cave style) | 56 |
| 14 | `przeszkoda2` | thick stone pillar, cracked, top broken (arena obstacle) | 40 |
| 15 | `stalagmit` | cluster of stalagmites, dark rock (arena obstacle) | 46 |

Już mamy: `beczka`, `krypta`, `dab` (wpisane w `src/art/assets.js`).

## 3. Tło areny Kopaczy (jedno)
Plik: `arena-kopacze.png`, **1520 x 952 px** (to plansza 11 x 9 w rzucie gry razy 2), pełna szerokość, bez przezroczystości. Szablon: `docs/pilot/szablon-areny.png` (siatka rombów 144 x 72 px, niebieskie pola startowe po lewej-górze, czerwone dla wrogów po prawej-dole).

Prompt (z referencją szablonu jako obraz wejściowy, jeśli generator to umie, np. ControlNet lub "image reference"):
> Top-down isometric 2:1 cave arena floor for a tactical game, dark packed earth with cracked flagstones and scattered bones, subtle cell lines matching the provided grid exactly, floor fills the whole diamond, slightly darker at the edges, no walls, no objects, no characters, no text, 1520x952, same hand-painted dark fantasy style.

Wymaganie twarde: rombu nie wolno przesunąć ani zeskalować (ruch i zasięgi liczone są po siatce). Po wygenerowaniu nałóż szablon z 50% przezroczystością w dowolnym edytorze i sprawdź, czy linie kafli się pokrywają. Obraz wkładamy do `www/img/arena-kopacze.png`. Gra sama go wykryje i narysuje zamiast generowanej podłogi (dla innych lochów nazwa `arena-<motyw>.png`).

## 4. Import (jedna komenda na obiekt)
```
python3 tools/import_asset.py surowy.png sosna --world-w 90
```
Czyści półprzezroczystą poświatę, przycina, skaluje, zapisuje do `www/img/sosna.png` i wypisuje gotowy wpis do wklejenia w `ASSETS` (`src/art/assets.js`). Wpisz go, a gdy obiekt ma zastępować istniejący w świecie (np. sosna), podepnij go w `objectDrawer` w `src/art/worldview.js` (tak jak dąb i beczka). Mogę to zrobić od razu po dostarczeniu plików.

## 5. Kryteria oceny pilotażu
1. Czy obiekty obok siebie wyglądają jak z jednej gry (kreska, kolory, światło)?
2. Czy skala pasuje do postaci (drzwi chaty, beczka, drzewa)?
3. Czy FPS na telefonie nie spadł (mierz w Menu, FPS) i ile waży aplikacja (cel: poniżej 25 MB)?
4. Czy bez cienia w obrazie cienie z gry wyglądają dobrze?
5. Czy tło areny trzyma siatkę?
Po pilotażu decydujemy: skalujemy podejście, mieszamy z kodem, czy wracamy do generatorów.
