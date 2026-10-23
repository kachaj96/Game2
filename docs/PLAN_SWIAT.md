# Plan: świat, eksploracja i poziomy (do akceptacji)

Status: **zatwierdzony** (poza tematem maksymalnego poziomu, patrz niżej). Zbudowany prototyp świata: `www/swiat.html` (chodzenie, kamera, wysokości, Kraina Kopca, wejścia do lochów), mapa `www/mapa.html`. Powstał po prośbie: maksymalny poziom, zalecany poziom lochu, osadzenie lochu w eksploracji, lokacja startowa z lochem nr 1, świat z nierównościami, chodzenie swobodne z kamerą za bohaterem.

## Czy rozumiem koncept
Tak. Dofus-like, ale bez map-ekranów:
- Świat to jedna ciągła przestrzeń. Bohater chodzi swobodnie (nie po kaflach, nie od ekranu do ekranu), kamera płynnie za nim jedzie.
- Świat ma wysokość: doliny, wzgórza, rzeki, klify. Nie jest płaską planszą.
- Wszędzie pieszo. Brak wierzchowców i szybkiej podróży na razie.
- **Walka zostaje na osobnej planszy turowej** (izometria 7x7, jak dziś). Do walki wchodzi się przez lochy, których wejścia stoją w świecie: jama pod drzewem, szczelina w głazie, zawalona krypta.
- Eksploracja nie ma losowych starć. Walka zaczyna się tylko po świadomym wejściu do lochu (decyzja do potwierdzenia, pyt. 5).

## 1. Poziomy

### Maksymalny poziom: 30
Zostaje 30, czyli to, co jest w kodzie (`MAX_LEVEL`). Powód jest w liczbach, nie w guście. Za poziom dostaje się 5 punktów cech, a koszt punktu rośnie: 1 do wartości 50, 2 do 100, 3 powyżej. Do poziomu 30 mamy 145 punktów, co kupuje około 97 w jednym żywiole. Czyli **poziom 30 to moment, w którym można zrobić jeden pełny żywioł (około 100)**. Przy poziomie 200 jak w Dofusie te progi straciłyby sens. Gdy świat urośnie, limit podnosimy razem z progami kosztu, nie samą liczbą.

W kodzie zostaje twardy limit 30 (walidacja zapisu), a **limit treści** podnosimy etapami: dziś 15, bo tyle poziomów pokrywają loch 1, loch 2 i region 2. Powyżej limitu treści punkty doświadczenia przestają rosnąć i gra to mówi wprost. Dzięki temu nikt nie dobije do poziomu, na którym nie ma już nic do roboty.

### Zalecany poziom lochu i skalowanie wrogów
Dotychczasowe założenie "wrogowie skalują się z bohaterem" w czystej postaci odbiera sens poziomom i światu: nie ma co zdobywać, jeśli wszystko zawsze jest tak samo trudne. Proponuję **skalowanie w paśmie lochu**:
- Każdy loch ma `zalecany poziom` i pasmo `od, do`.
- Poziom wrogów = poziom bohatera, ale nie niższy niż `od` i nie wyższy niż `do`.
- Bohater poniżej pasma trafia na wrogów silniejszych od siebie (groźnie, możliwe do wygrania z kompanami i dobrą taktyką). Powyżej pasma wrogowie są słabsi, a nagrody maleją.
- Przy wejściu do lochu karta pokazuje: zalecany poziom, rodzinę wrogów, ile miejsc na kompanów. Ostrzeżenie jest tekstowe, **bez blokady** (jak w Natalis, decyzja autora; do potwierdzenia, pyt. 2).

| Loch | Zalecany poziom | Pasmo | Wrogowie | Wejście w świecie |
|---|---|---|---|---|
| 1. Podziemne Korytarze | 3 | 2 do 6 | Kopacze | zawalona krypta na Cmentarnym Wzgórzu |
| 2. Gniazdo | 8 | 6 do 10 | owady i pajęczaki | jama pod korzeniami olbrzymiego drzewa w Lesie Robali |
| 3. (region zachodni) | 13 | 11 do 15 | do ustalenia | do ustalenia |
| Pogrzebana Arena | 28 | 25 do 30 | wszystkie rodziny, bossowie | zapieczętowana brama na dnie lochu 1, otwiera się później |

Wartości do strojenia symulacją po zbudowaniu lochów (ta sama metoda co w planie przeciwników).

### Obawa: gracz za szybko dobije do limitu i zostanie bez aren i krypt
Słuszna obawa i dlatego **liczba lochów nie może zależeć od poziomu**. Proponuję cztery zabezpieczenia, które działają razem:
1. **Wolna krzywa XP.** Poziom 15 ma wymagać kilkunastu godzin, poziom 30 kilkudziesięciu. Dokładne liczby ustala symulacja (czas jednego przejścia lochu około 15 minut, XP rośnie wolniej niż potrzeba na kolejny poziom), a nie zgadywanie.
2. **Rangi lochów zamiast kolejnych lochów na każdy poziom.** Każdy loch ma trzy rangi: zwykła, wzmocniona (pasmo wyżej, inne składy wrogów i bossa, nowe czary wrogów) i legendarna (modyfikatory walki, np. mniej PA, wrogowie leczą się z grobów). Jedna krypta daje więc trzy razy więcej gry, także po osiągnięciu limitu poziomu.
3. **Postęp po limicie.** Po poziomie 30 idą **poziomy mistrzowskie**: każdy daje 1 punkt cechy, kosztuje tyle XP co kilka zwykłych poziomów i ma własny limit (np. 100). Do tego ekwipunek, rzemiosło i profesje, czyli to, co w Dofusie trzyma ludzi po limicie.
4. **Dostęp do treści przez świat, nie tylko przez poziom.** Kolejne regiony otwierają się zadaniem (np. odbudowa mostu na Starym Trakcie), więc poziom nie jest jedynym kluczem.

Na dziś wystarczy sam **limit treści 15** i krzywa XP do zaprojektowania przy pierwszych lochach. Rangi i poziomy mistrzowskie wchodzą, gdy loch 1 będzie grywalny od początku do końca.

## 2. Świat

### Zasada: świat to hybryda ręcznych kotwic i generatora
Cały świat ręcznie rysowany to miesiące pracy i duże pliki. Cały losowy nie ma charakteru. Dlatego: **ręcznie wyznaczone kotwice** (wioska, wejścia do lochów, drogi, rzeki, charakterystyczne wzgórza) plus **generator**, który z ziarna i reguł regionu dokłada wzgórza, drzewa, kamienie, kępy, drobne ścieżki. Generator jest deterministyczny, jak wszystkie w grze: to samo ziarno daje ten sam świat.

### Region 1: Kraina Kopca (robocza nazwa)
Cały pierwszy kontynent ma około 200 x 200 kafli. Przy chodzie 3,5 kafla na sekundę przejście od końca do końca zajmuje około minuty, więc świat jest zwarty na start i da się go swobodnie rozszerzać.

```
                 PÓŁNOC
        ┌──────────────────────────┐
        │   Cmentarne Wzgórze      │   wzgórze do 6 poziomów wysokości
        │   [Wejście: loch 1]      │   krypta w zboczu
        │        ▲▲▲               │
        │   Stary Trakt (zachód)   │───► zamknięty zawalonym mostem, region 2
 ZACHÓD │ ═══════════════╗         │
        │      Kopiec    ║ rzeka   │   Las Robali
        │   (wioska,     ║         │   [Wejście: loch 2]
        │    dolina)     ╚═════════│   obniżenie, wilgoć, grzyby
        │      pola                │   olbrzymie korzenie
        └──────────────────────────┘
                 POŁUDNIE
```

- **Kopiec** (wioska startowa): w dolinie, przy rzece. Plac, tawerna, kuźnia, sklep, domy z istniejących generatorów budynków. Tu jest kreator postaci i pierwsza rozmowa. Wysokość 0.
- **Pola i rzeka:** równina i płytkie koryto (poziom wysokości -1), brody i mostek. Tu uczymy chodzenia, tu stoją pierwsze NPC.
- **Cmentarne Wzgórze** (północ): wysokość do 6 poziomów, ścieżka serpentyną, kilka tarasów z grobami, na szczycie stary kopiec. Zawalona krypta w zboczu to **wejście do lochu 1**. Najbliższe od wioski: około 40 kafli, czyli kilkanaście sekund.
- **Las Robali** (wschód): niecka niżej od doliny, gęsty las z grzybami, olbrzymimi korzeniami i pajęczynami między drzewami. Początek lasu jest bezpieczny i zachęca, głębiej robi się coraz ciemniej i gęściej. **Wejście do lochu 2** to jama pod korzeniami wielkiego drzewa, widoczna z daleka dzięki kokonom i pajęczynom. Około 60 kafli od wioski.
- **Stary Trakt** (zachód): droga w stronę kolejnych regionów, na razie przerwana zawalonym mostem. Otwiera się później (zadanie albo poziom). To obietnica świata i miejsce na rozbudowę.
- **Pogrzebana arena** jest pod wszystkim: korytarze Kopaczy prowadzą w dół do zapieczętowanej bramy. Na razie to zapowiedź na końcu lochu 1, nie dostępna treść.

### Nierówności terenu
- Siatka wysokości w półkaflach: **poziomy wysokości od -2 do 6**. Dolina 0, rzeka -1, wzgórza do 6, Las Robali -1 do 1.
- Zbocza łagodne (różnica 1 poziomu na kafel) są chodliwe i cieniowane (światło z lewej góry, jak reszta gry). Różnica 2 i więcej to **klif**: nie wchodzi się, rysujemy ściankę skalną, a przejście jest tylko schodami lub rampą wyznaczoną w kotwicach.
- Pod górę idzie się trochę wolniej (-15%), z góry normalnie.
- Woda głębsza niż -1 nie jest chodliwa.

### Jak to jest rysowane i liczone
- Świat jest podzielony na **bloki 16 x 16 kafli**. Gotowe bloki wokół bohatera trzymamy w pamięci i rysujemy z podręcznego obrazu (wydajność na telefonie), reszta jest generowana na bieżąco i usuwana.
- Rzut taki sam jak w walce (2:1, kafel 72 x 36), więc budynki, drzewa i postacie z obecnych generatorów działają bez zmian. Wysokość to przesunięcie w pionie na ekranie.
- Ruch swobodny: pozycja bohatera to liczby rzeczywiste, kolizja z kaflami nieprzechodnimi i z obrysami obiektów. Ścieżki wyznacza A* po siatce, wygładzone.
- **Logika w `src/world/`, deterministyczna, bez canvasa i DOM** (jak reszta). Rysowanie osobno. Walka, wejście do lochu i powrót korzystają z tych samych komend co dziś.

### Sterowanie (dotyk)
- **Dotknij, by iść:** dotknięcie ziemi pokazuje trasę, drugie dotknięcie w to samo miejsce potwierdza (zasada podglądu ze wszystkich dotychczasowych ekranów). Dotknięcie wejścia do lochu prowadzi do niego i otwiera kartę.
- Albo **przeciągnij palec** jak drążek (do ustalenia, pyt. 3).
- Żadnej funkcji zależnej od najechania myszą.

### Wejście do lochu
Karta przy wejściu: nazwa, rodzina wrogów, zalecany poziom i pasmo, liczba miejsc dla kompanów (limit wrogów = 4 + kompani), przycisk "Wejdź". Po wyjściu z lochu bohater staje przy wejściu w tym samym miejscu świata. Każde wejście ma własny wygląd dopasowany do wrogów (motywy z `theme.js`): krypta dla Kopaczy, jama z pajęczyną dla owadów. To nowe generatory (`gen...`/`draw...` z testami), nie pliki.

## 3. Kolejność budowy (każdy krok sprawdzany w przeglądarce i testami)
1. **Silnik świata na prototypie:** bloki, siatka wysokości, rzut z wysokością, kamera, ruch swobodny z kolizją, dotknij by iść. Teren z pagórkami i klifem, bez docelowej grafiki. Testy: determinizm, brak wchodzenia na klif, A* dochodzi do każdego celu, wydajność (ramka poniżej 16 ms na przeciętnym telefonie).
2. **Kraina Kopca:** kształt terenu, wioska z istniejących budynków, rzeka, droga, Cmentarne Wzgórze, wejście do lochu 1. Testy: każde wejście osiągalne pieszo ze startu, nachylenia na drogach w limicie, żaden obiekt nie blokuje trasy.
3. **Przejście świat, loch, świat:** karta wejścia, zalecany poziom i pasmo skalowania, powrót w to samo miejsce, zapis pozycji.
4. **Las Robali i loch 2** po akceptacji planu owadów i pajęczaków.
5. **Stary Trakt i region 2.**

## Ryzyka (mentor mode)
- **Największe ryzyko to wysokość razem z kolejnością rysowania i telefonem.** Postać chowa się za wzgórzem, drzewem, klifem. Rysowanie z kolejnością głębokości plus wysokość, blokami i kolizją to sprawdzony, ale trudny układ. Dlatego krok 1 jest prototypem bez ładnej grafiki: jeśli na telefonie nie utrzyma płynności, zmieniamy zakres (mniej poziomów wysokości, mniejszy widok) zanim powstanie jakakolwiek treść.
- **Bohater schowany za przeszkodą.** Potrzebna jest sylwetka widoczna przez drzewa i skały (kontur lub półprzezroczystość). Dodajemy w kroku 1.
- **Pustka.** Duża przestrzeń bez zdarzeń nudzi szybciej niż mały, gęsty świat. Dlatego region 1 jest mały, a każde kilkanaście kroków ma coś: NPC, skrzynię, ślad, widok.
- **Skalowanie w paśmie** może się wydawać karą dla gracza poniżej pasma. Stąd ostrzeżenie tekstowe i kompani jako wyrównanie.
- **Poziom 30 przy treści do 15** to pusta górna połowa. Stąd osobny limit treści, który rośnie z regionami.
- **Zapis**: pozycja, odkryte miejsca, otwarte skróty i pasma muszą trafić do zapisu z wersjonowaniem, bo świat będzie się zmieniał.

## Pytania do autora
1. **Loch nr 1:** Kopacze pod Cmentarnym Wzgórzem (moja propozycja, rodzina z zatwierdzonego planu), a Las Robali jako region z lochem nr 2? Czy zacząć od lasu, a Kopaczy dać później?
2. **Poziomy:** max 30 z limitem treści 15 na teraz? Skalowanie wrogów w paśmie lochu zamiast bez końca? Ostrzeżenie tylko tekstowe, bez blokady?
3. **Sterowanie:** samo "dotknij, by iść" (podgląd trasy, drugie dotknięcie potwierdza), czy dodatkowo przeciąganie palcem jak drążek?
4. **Teren:** zbocza gładko cieniowane i klify ze skały tam, gdzie różnica to 2 poziomy i więcej (moja propozycja), czy wolisz wyraźne tarasy schodkowe wszędzie?
5. **Starcia w świecie:** tylko wejście do lochu (moja propozycja na start), czy mają być też widoczni wrogowie chodzący po świecie, z którymi można się zderzyć?
