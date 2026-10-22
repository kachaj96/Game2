# Plan: przeciwnicy (do akceptacji)

Status: **czeka na akceptację**. Nic z tego nie jest jeszcze zbudowane. Obecne 5 "tymczasowych" wrogów z `bestiary.js` (wszyscy z Cios Łopatą) zostaje zastąpione.

## Założenia od autora
- Lochy tematyczne: wrogowie różni, ale z jednej rodziny, jak Gobballe w Dofusie. Każdy rodzaj ma inne PA, PM, inicjatywę i czary.
- Jedni i drudzy: **stworzenia** i **istoty humanoidalne**.
- Wróg gra jak gracz (te same komendy, te same zasady), ale ma 1 do 3 czarów, nie pełny zestaw.
- Na start 5 rodzajów. Są bossowie. Wszyscy skalują się z poziomem bohatera.
- Limit: bohater sam = **maks. 4 wrogów**. Każdy kompan (zwierzak, towarzysz, drugi gracz) = **+1 wróg**.

## 1. Rodzina na start: Kopacze (loch "Podziemne Korytarze")
Stworzenia, które żyją pod areną i żywią się tym, co tam pochowano. Wspólny wygląd: garbate, długie pazury, ślepe albo z małymi oczami, kolor ziemi i kości. Różnią się sylwetką, wyposażeniem i zachowaniem, nie tylko kolorem (zasada z CLAUDE.md).

| Rodzaj | Rola | PA | PM | Inic. | HP (L1) | Czary |
|---|---|---|---|---|---|---|
| Kopacz | bijatyk, szybko dobiega | 6 | 4 | 12 | 30 | Pazury (ziemia, 1 pole, 3 PA), Wyrzut (ziemia, odpycha o 1, 3 PA) |
| Pancerny | tank, wolny, blokuje przejście | 5 | 2 | 6 | 60 | Pancerz (ziemia, 1 pole, 3 PA), Taran (ziemia, odpycha o 2, 4 PA, 1 raz na turę) |
| Szperacz | zwiadowca, ucieka w cień | 4 | 5 | 16 | 24 | Zryw (powietrze, 1 pole, 2 PA), Błoto (woda, zasięg 2, 2 PA, zwalnia: -1 PM) |
| Pluja | strzelec, trzyma dystans | 7 | 3 | 10 | 26 | Pocisk (ogień, zasięg 2 do 5, w linii, 3 PA), Kurz (powietrze, chmura blokuje widoczność, 3 PA) |
| Żerca | padlinożerca, leczy się cudzą śmiercią | 6 | 3 | 8 | 30 | Ugryzienie (neutralny, 1 pole, 3 PA), Pożarcie (zjada grób obok: leczy 25% HP, 2 PA) |

Rodzaje używają **wszystkich czterech żywiołów**, ale każdy ma jeden "domowy". Dzięki temu odporności wroga mówią coś o jego zachowaniu, a Księga Czarów gracza ma co odkrywać.

### Odporności (odkrywane w walce, zasada z planu żywiołów)
Średnia rodziny jest bliska 0, pojedyncze rodzaje odchylają się o 25 do 40 punktów. Każda klasa startowa ma przy jakimś rodzaju wyraźną przewagę i przy innym wyraźny kłopot:

| Rodzaj | Ziemia | Ogień | Woda | Powietrze |
|---|---|---|---|---|
| Kopacz | +25 | -25 | 0 | 0 |
| Pancerny | +40 | -10 | -25 | 0 |
| Szperacz | 0 | 0 | 0 | +30 |
| Pluja | -10 | +30 | -25 | 0 |
| Żerca | 0 | -25 | +25 | 0 |

Czyli: ogień (Żałobnik) łamie Kopacza i Żercę, ale odbija się od Pluji. Reszta klas ma swoje odpowiedniki, ostateczne liczby strojone symulacją (pkt 6).

### Zachowania (profile AI)
Wróg używa tych samych komend co gracz. Profil to tylko preferencje przy wyborze celu i pola:
- **Bijatyk** (Kopacz): idzie do najbliższego, bije najmocniejszym czarem.
- **Blokujący** (Pancerny): idzie do bohatera, ale zatrzymuje się tak, by zasłaniać korytarz sojusznikom. Taranem odpycha w ścianę.
- **Zwiadowca** (Szperacz): atakuje i **ucieka** za osłonę, jeśli ma PM. Celuje w najsłabszego (najmniej HP).
- **Strzelec** (Pluja): trzyma odległość 2 do 5, ustawia się w linii, jeśli bohater podchodzi, cofa się. Kurzem zasłania się przed bohaterem.
- **Padlinożerca** (Żerca): trzyma się blisko trupów. Jeśli obok leży grób, zjada go, zanim zaatakuje.

## 2. Nowe mechaniki potrzebne wrogom
Silnik ich jeszcze nie ma. Każda to osobny, testowany krok:
1. **Leczenie** (Pożarcie): dodaje HP, nie więcej niż max.
2. **Zjadanie grobu**: usuwa grób z pola, wymaga sąsiedztwa. Daje też graczowi taktykę: grób pod Żercą to pole, które można zająć.
3. **Spowolnienie** (-PM do końca następnej tury): potrzebne Szperaczowi, a docelowo i graczowi.
4. **Przywołanie** (tylko boss, później): wróg dokłada jednostkę na wolne pole, liczy się do limitu z pkt 4.

Pułapki i glify (już oznaczone w grze jako "wkrótce") nie są potrzebne do startu.

## 3. Boss: Król Kopców
Stworzenie ogromne, z koroną z czaszek. PA 8, PM 2, HP 160 + 24 na poziom, inicjatywa 7.
- Czary: Taran (ziemia, odpycha o 3, 4 PA, 1 raz na turę), Kopnięcie (ziemia, 3 PA), Wezwanie (przywołuje Kopacza, 4 PA, co 3 tury, **nie przy pełnym limicie wrogów**).
- Fazy: poniżej 50% HP wpada w szał (+1 PA, Wezwanie co 2 tury). Faza to wpis w danych, nie osobny kod.
- Odporności: ziemia +30, woda -30. Odkrywane jak u innych.
- Bohater zabija go w około 6 tur. Obrażenia bossa to około 0.25 HP bohatera na turę, więc walka jest długa, ale nie zabójcza sama w sobie. Groźne są dodatki, nie sam boss.

## 4. Skład spotkania i limit
- **Limit = 4 + liczba kompanów.** Bohater solo: 4. Z jednym zwierzakiem: 5. Z dwoma kompanami: 6.
- Generator składu dostaje (seed, poziom, liczba kompanów) i zwraca listę. Deterministycznie, tylko przez `rng`.
- Boss zajmuje **1 miejsce**, ale solo walczy z nim co najwyżej 2 dodatkowych wrogów (a nie 3), bo boss sam jest za ciężki na pełny limit. Do potwierdzenia, patrz pytania.
- Skład ma ograniczenia: zawsze minimum 2 różne rodzaje przy 3+ wrogach, maks. 2 Pancernych (inaczej plansza się zatyka), maks. 2 Żerców.
- Plansza ma nie mniej niż 10 pól swobody na wroga (test na losowych seedach).

## 5. Skalowanie z bohaterem
Dla poziomu L:
- HP = baza + przyrost × (L - 1): Kopacz 30 + 6, Pancerny 60 + 10, Szperacz 24 + 4, Pluja 26 + 4, Żerca 30 + 5, boss 160 + 24.
- Moc żywiołu = 4% × (L - 1) (bohater dostaje do 72% na L20 z pełną inwestycją, więc wróg jest wyraźnie słabszy, ale ma więcej HP przez ilość).
- Poziom czarów = min(5, 1 + (L - 1) / 4).
- Wszystkie obrażenia wrogów mnożone przez **0.62** (`damageScale`). Powód: pierwsza wersja liczb dawała przy 4 wrogach 1.03 do 1.26 życia bohatera na rundę, czyli śmierć w jedną turę.
- PA i PM wrogów **nie rosną**. Trudność ma rosnąć liczbą i składem, nie tym, że wróg dostaje 12 PA.

### Kontrola: najgorsza runda (4 wrogów, wszyscy trafiają, bohater o jednym żywiole) jako ułamek HP bohatera
| Skład | L1 | L5 | L10 | L20 |
|---|---|---|---|---|
| 4 Kopacze | 0.78 | 0.69 | 0.70 | 0.74 |
| Kopacz, Pancerny, Pluja, Żerca | 0.73 | 0.65 | 0.64 | 0.68 |
| 2 Szperacze, 2 Pluje | 0.78 | 0.71 | 0.69 | 0.75 |

Cel to maks. 0.8. To najgorszy przypadek, w praktyce część rzutów nie dosięgnie, a bohater zabija zwykłego wroga w 1 do 2 tur (Pancernego w 2 do 3). Ostateczne liczby ustali symulacja (pkt 6).

## 6. Jak to będzie testowane
- Dane wrogów mają testy spójności jak klasy: każdy czar coś robi, zasięgi i PA mieszczą się w limitach, odporności w zakresie.
- **Symulacja**: deterministyczny test gra N walk bohater (strategia referencyjna) kontra skład, dla L 1, 5, 10, 20, i sprawdza: bohater wygrywa 60 do 90% walk, nigdy nie ginie w pierwszej rundzie, walka kończy się w 3 do 10 rund.
- Test limitu: `4 + kompani`, dla seedów 0..200.
- Test różnorodności: dwa wygenerowane stwory z różnych ziaren nie są kopiami (zasada generatorów).
- Każdy wróg ma wpis w Księdze Wrogów (analog Księgi Latarni z Natalis), bez wpisu CI nie przejdzie. Wpis ujawnia czary i odporności dopiero po zobaczeniu w walce.

## 7. Wygląd
- **Stworzenia**: nowy generator `genKopacz(ziarno)` / `drawKopacz`, wariant na rodzaj (garb, liczba pazurów, pancerz z kości, oczy, ogon). Billboard, 4 kierunki jak postacie, chód z `t`.
- **Humanoidy** (druga rodzina, po akceptacji pierwszej): "Echa" pochowanych, czyli zjawy w strzępach strojów dawnych klas. Używają `characters.js` z półprzezroczystą paletą i światłem (`mood.glow`), więc nie ma nowego silnika rysowania.
- Kontury i światło jak reszta gry (`OUT`, oświetlenie z lewej góry). Pierścień pod stworem czerwony.
- Przed budową zrobię stronę z szkicem rodziny (`www/przeciwnicy.html`) do oceny wyglądu.

## 8. Kolejność budowy
1. Dane wrogów + mechaniki (leczenie, zjadanie grobu, spowolnienie) + testy. Zastępuje tymczasowy bestiariusz.
2. Profile AI + test zachowań (np. Pluja trzyma dystans, Szperacz ucieka).
3. Generator wyglądu Kopaczy + strona z szkicami + zrzuty.
4. Generator składu spotkania + limit + testy.
5. Symulacja balansu i strojenie.
6. Boss Król Kopców z fazami i przywołaniem.
7. Księga Wrogów i wpis w odkrywaniu odporności.
8. Rodzina humanoidów (Echa) jako osobny etap.

## Ryzyka (mentor mode)
- **Pancerny + Taran w korytarzu** potrafi unieruchomić bohatera między ścianą a trupem. Dlatego Taran ma 1 użycie na turę, a odrzut w ścianę boli, ale nie ogłusza.
- **Szperacz uciekający** w AI łatwo zamienia się w pętlę (ucieka, wraca, ucieka). Limit: ucieczka tylko po własnym ataku, nie w tej samej turze co ruch wejściowy.
- **Żerca** przy dużej liczbie grobów leczy się szybciej, niż bohater zadaje obrażenia. Bohater zabijający wrogów sam karmi Żercę. To zamierzone, ale limit 2 Żerców i 25% HP na zjedzenie to hamulec. Do sprawdzenia w symulacji.
- **Limit z kompanami** rośnie liniowo, a siła bohatera z kompanem nie. Przy 2 kompanach masz 6 wrogów na jedną planszę, więc trzeba sprawdzić czytelność (siatka, kolejka tur). Kompani muszą więc realnie dokładać obrażeń i HP, inaczej każdy kompan jest karą.
- Zakładam gracza o jednym żywiole. Gracz mieszający żywioły będzie słabszy w liczbach, ale dostaje pokrycie odporności. Symulacja musi sprawdzić obie strategie.

## Pytania do autora
1. Boss i limit: czy boss liczy się jako 1 z 4, ale solo ma najwyżej 2 dodatki (moja propozycja), czy limit 4 stosuje się bez wyjątku?
2. Czy nowe mechaniki (leczenie, zjadanie grobu, spowolnienie, przywołanie bossa) są OK, czy któraś ci nie pasuje?
3. Kolejność rodzin: Kopacze (podziemne korytarze) pierwsi, potem Echa (humanoidy)? Czy wolisz zacząć od humanoida?
4. Wygląd: stworzenia garbate, ślepe, w kolorach ziemi i kości. Pasuje do "Pogrzebanej areny", czy chcesz coś innego (owady, wilki, coś bardziej niepokojącego)?
