# Plan: żywioły, odporności, statystyki, ikony i pasek czarów

**Status: ZATWIERDZONY (22.10.2026), w budowie.** Decyzje: cztery żywioły plus neutralny, Witalność i moce żywiołów, skróty ze stronami z Księgą Czarów, odporności odkrywane w trakcie (pokazywane po pierwszym trafieniu danym żywiołem). Koncept ikon: `www/ikony.html`, zrzut `docs/podglad/ikony.png`.

## 1. Co zmienia się dla gracza

- Każdy czar atakujący ma **żywioł**, widoczny jako kolor i kształt ramki ikony oraz kolor liczby obrażeń.
- Każdy przeciwnik ma **odporności** na żywioły (procenty, także ujemne, czyli słabość). Dobór żywiołu czaru do wroga zmienia wynik walki.
- **Statystyki** z poziomów (witalność i moc każdego żywiołu) realnie zmieniają życie i obrażenia.
- **Pasek czarów** mieści dowolną liczbę czarów dzięki skrótom ze stronami i Księdze Czarów.

## 2. Żywioły i przypisanie czarów

Cztery żywioły i neutralny. Nazwy i kolory (kształt ramki dla osób z daltonizmem):

| Żywioł | Kolor | Kształt ramki |
|---|---|---|
| Ziemia | brąz | kwadrat |
| Ogień | czerwień | koło |
| Woda | niebieski | sześciokąt |
| Powietrze | zieleń | romb |
| Zwykłe (neutralny) | szary | tarcza |

**Przewodni żywioł klasy** (pierwsze czary i podpowiedź w awansie): Grabarz Ziemia, Tropiciel Powietrze, Żałobnik Ogień. Woda nie ma czarów startowych, bo ma przyjść z czarów zdobywanych, niezależnie od klasy.

| Czar | Klasa | Żywioł |
|---|---|---|
| Cios Łopatą, Zrzut Ziemi, Dół | Grabarz | Ziemia |
| Bełt | Tropiciel | Powietrze |
| Sidła | Tropiciel | Ziemia |
| Skok w Cień | Tropiciel | Zwykłe (bez obrażeń) |
| Żar, Stos Pogrzebowy | Żałobnik | Ogień |
| Podmuch Popiołu | Żałobnik | Powietrze |

Kolejne czary z innych żywiołów (przykłady nazw, do uzgodnienia): Grabarz: Szron na Kościach (Woda), Żar Pochodni (Ogień). Tropiciel: Strzała Mgły (Woda), Płonący Bełt (Ogień). Żałobnik: Łzy Żałoby (Woda), Kamienny Całun (Ziemia).

## 3. Odporności i wzór obrażeń

Jak w Dofusie, ale uproszczone:

```
obrażenia = floor( rzut(min..max) x (1 + (cecha żywiołu + moc ogólna) / 100) ) + obrażenia stałe
po odporności = floor( obrażenia x (1 - odporność% / 100) ),  minimum 0
```

- Odporność ujemna zwiększa obrażenia (słabość). Limit: gracz do +50%, przeciwnik do +75%. Zwykłe obrażenia (neutralne) nie korzystają z cechy żywiołu, tylko z mocy ogólnej.
- **Obrażenia z kolizji (odpychanie) są stałe:** nie zależą od cech ani odporności. Zostają tak, jak jest teraz.
- Odporności procentowe na pierwszą wersję. Odporność stała (odejmowana na końcu, z ekwipunku) później.
- Reguła projektowa pilnowana testem: **każdy przeciwnik ma co najmniej jeden żywioł z odpornością <= 0**, żeby żaden build nie trafił na ścianę nie do pokonania.

Przykład (Żar 12-16, Żałobnik poz. 10, 45 punktów w Ogień = +45%):

| Przeciwnik | Wynik |
|---|---|
| bez odporności | 17-23 |
| słaby na ogień (-20%) | 20-27 |
| odporny na ogień (+30%) | 11-16 |
| bardzo odporny (+75%) | 4-5 |
| bez cech Ognia, żywioł Wody | 12-16 |

**Co z tego wynika (świadomy kompromis):** punkty cech dają około +45%, a odporność zmienia wynik o 30% lub więcej, więc dobór żywiołu czaru ma znaczyć tyle samo co cechy. To zachęca do noszenia czarów z 2 żywiołów, ale mono-żywiołowy build jest silniejszy w typowych walkach. Ten kompromis wymaga strojenia po zagraniu.

Odporności przeciwników (archetypy na arenę, propozycja): Strażnik (Ziemia +30, Ogień -20, Powietrze +10), Popielny (Ogień +50, Woda -30), Topielec (Woda +50, Ogień -30), Wichrzyciel (Powietrze +40, Ziemia -30), Szkielet (Zwykłe +20, reszta 0).

## 4. Statystyki z poziomów

5 punktów cech za każdy poziom bohatera (od poziomu 2). Punkty można wydać na:

| Cecha | Co daje |
|---|---|
| Witalność | +1 życia za punkt |
| Moc Ziemi / Ognia / Wody / Powietrza | +1% obrażeń danego żywiołu za punkt |

Tylko ekwipunek daje (faza 3): moc ogólna (wszystkie żywioły), obrażenia stałe, zasięg czarów, +PA, +PM, odporności. Później: krytyk, unik PA/PM, mądrość. Życie ma też część stałą z poziomu klasy: Grabarz 62 + 7 za poziom, Tropiciel 46 + 5, Żałobnik 38 + 4.

**Koszt rośnie wraz z wartością cechy** (jak w Dofusie): 1 punkt za punkt cechy do 50, 2 punkty za punkt od 51 do 100, 3 powyżej. Dzięki temu z 95 punktów (poz. 20) maksymalna jedna cecha to 72, a nie 95, i opłaca się rozkładać.

Przykładowe buildy Żałobnika na poziomie 10 (45 punktów):

| Build | Życie | Żar 12-16 |
|---|---|---|
| wszystko w Ogień | 74 | 17-23 |
| 22 Witalność, 23 Ogień | 96 | 14-19 |

Życie bazowe na poz. 10: Grabarz 125, Tropiciel 91, Żałobnik 74. Cechy z kreatora (przeszłości i cechy charakteru) zostaną przemapowane na nowe statystyki, tabelę pokażę po akceptacji.

## 5. Ikony czarów

Rysowane kodem, bez plików (zasada projektu). Medalion w kolorze i kształcie żywiołu, symbol unikalny dla czaru, liczba w rogu to koszt PA. Stany: zwykły, wybrany (żółty pierścień), za mało PA (przyciemniony, czerwony koszt), odnowienie (liczba tur), jeszcze nie działa ("wkrótce"). Testy: każdy czar ma żywioł i symbol, wszystkie stany rysują się bez złych liczb.

## 6. Pasek czarów i karty

Obecny pionowy stos przycisków nie pomieści więcej niż 4 czarów. Propozycja (makieta w `www/ikony.html`):

- **Pasek skrótów u dołu:** 6 widocznych ikon (56 px), strony przyciskami i przesunięciem, do 4 stron (24 skróty). Plansza zostaje wyśrodkowana nad paskiem.
- **Dotknięcie ikony** wybiera czar i pokazuje **kartę czaru**: żywioł, koszt, zasięg, widoczność, widełki obrażeń, a po wskazaniu wroga także z jego odpornością (np. "12-16, przy odporności +30%: 8-11").
- **Dotknięcie wroga** (bez czaru) pokazuje **kartę wroga** z odpornościami.
- **Księga Czarów** (ekran poza walką): wszystkie czary klasy, rozwój poziomów za punkty czaru, przypisywanie do slotów. Na początku sloty wypełniają się same.
- Rozważone i odrzucone: lista przewijana (wolna, zasłania planszę), koło radialne (zasłania cel).

## 7. Fazy budowy (każda z testami)

**Postęp:** A (żywioły i odporności w logice) gotowa. C (ikony w grze) i D (pasek skrótów, karty czaru i wroga, odkrywanie odporności) gotowe. E (kolory liczb obrażeń według żywiołu) gotowa w walce. B (model postaci, punkty cech i czarów, zapis, Karta postaci `www/postac.html`, podpięcie do walki) gotowa. Poziom jest na razie ustawiany ręcznie na karcie (tryb testowy), bo nie ma jeszcze doświadczenia ani świata. Układ poziomy: pasek w prawej kolumnie (3x2 ikony), bo romb planszy zostawia tam miejsce, a pasek u dołu zjadał wysokość i zmniejszał kafle. W pionie pasek jest u dołu.


| Faza | Zakres | Dowód |
|---|---|---|
| A | Żywioły w danych i wzorze obrażeń, odporności przeciwników, nowe nazwy statystyk, kolor liczb obrażeń | testy wzoru (tabela z pkt 3), limity odporności, ujemne odporności, kolizje bez wpływu cech, reguła "każdy wróg ma słabość lub neutralność" |
| B | Model postaci: poziom, punkty, koszty, życie z poziomu, ekran awansu na dotyk | testy kosztów i sum, deterministyczne wyliczenia, test dotykowy awansu |
| C | Ikony zintegrowane z grą (stany, koszt, odnowienie) | testy rysowania, test dotykowy |
| D | Pasek skrótów ze stronami, karta czaru, karta wroga, Księga Czarów w wersji podstawowej | test dotykowy: ponad 6 czarów, zmiana strony, karty, rzut |
| E | Kolorowanie efektów i liczb żywiołem w całej walce | zrzuty ekranu |

Kolejność: A, potem C, D, B, E (ikony i pasek potrzebują żywiołów, awans potrzebuje paska).

## 8. Ryzyka

1. **Zachęta do jednego żywiołu.** Cechy każdego żywiołu osobno nagradzają mono-build, a "kolejne czary z innych żywiołów" będą słabsze bez cech tego żywiołu. Łagodzi to moc ogólna z ekwipunku i odporności, które czasem zmuszają do zmiany żywiołu. Do strojenia po zagraniu.
2. **Twarde kontry.** Odporność +75% zjada prawie całe obrażenia. Dlatego reguła "każdy wróg ma słabość lub neutralność" i limit odporności.
3. **Czytelność na małym ekranie.** Ikona 56 px musi się dać rozpoznać palcem i okiem. Sprawdzam na emulacji telefonu, ale to i tak wymaga Twojej oceny w ręku.
4. **Migracja.** Obecne nazwy cech (siła, zręczność, moc, wytrzymałość) w kreatorze i danych zastąpią nowe. Zmienią się liczby w przeszłościach i cechach charakteru.
