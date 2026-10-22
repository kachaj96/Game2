# Klasy startowe i kreator postaci

**Status: klasy, nazwy, wygląd, groby i 6 PA / 3 PM zatwierdzone (22.10.2026).** Liczby czarów to nadal propozycja do strojenia po pierwszych walkach. Dane źródłowe: `src/game/classdata.js` (liczby, testowane) i `src/art/classes.js` (wygląd). Podgląd: `www/klasy.html` i `www/kreator.html`, zrzuty w `docs/podglad/klasy.png` i `kreator.png`.

## Zasady wspólne

- Każda klasa startuje z **6 PA i 3 PM**. Ekwipunek może je zwiększać. Liczby jak w Dofusie są sprawdzone (czary po 2 do 4 PA dają dwa, trzy rzuty na turę), więc ich nie zmieniam. Różnicę względem Dofusa dają mechaniki: groby, zasady czarów i świat.
- Każda klasa ma **3 czary po 5 poziomów**. Za każdy poziom bohatera dostajesz **1 punkt czaru**. Podniesienie czaru z poziomu n na n+1 kosztuje n punktów, czyli pełny rozwój jednego czaru to 10 punktów, wszystkich trzech 30.
- Za każdy poziom bohatera dostajesz też **5 punktów cech**: życie, siła, zręczność, moc, wytrzymałość. Klasa ma cechę główną (Grabarz siła, Tropiciel zręczność, Żałobnik moc).
- Wszystkie cztery wybrane mechaniki są w czarach: odpychanie (Zrzut Ziemi, Podmuch Popiołu), linia widzenia (Bełt, Żar, chmura popiołu), pułapki i glify (Dół, Sidła, Stos Pogrzebowy), odnowienia i limity punktów (wszystkie).
- Klasy nie różnią się sposobem poruszania mechanicznie, tylko wizualnie: Grabarz stąpa ciężko, Tropiciel się skrada, Żałobnik płynie tuż nad ziemią.

## Mechanika wyróżniająca: groby

Każda pokonana jednostka zostawia na kaflu **grób**. Grób blokuje ruch, daje osłonę (blokuje linię widzenia) i jest paliwem dla czarów. Dzięki temu pasuje do fabuły Pogrzebanej areny i daje bohaterom wspólny język: Grabarz je kopie i wykorzystuje jako zasłonę, Żałobnik czerpie z nich moc (Żar i Stos Pogrzebowy są mocniejsze przy grobie), a Tropiciel zastawia w nich sidła. Plansza zmienia się w trakcie walki.

## Klasy

### Grabarz (Wojownik)

Kopie groby, zanim ktoś w nie wpadnie. Walczy z bliska i ustawia przeciwników tam, gdzie chce.

**Wygląd i ruch.** Szeroki kapelusz, jeden wielki naramiennik, łopata-topór, latarnia u pasa. Ciężki, miarowy krok.

**Start:** życie 62 (+7 za poziom), inicjatywa 15, 6 PA, 3 PM.

**Cios Łopatą** (damage): Uderzenie z bliska. Najmocniejszy cios na PA wśród klas startowych, ale wymaga stania przy przeciwniku.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 1-1 | 0 | 2 | 15-19 obr. |
| 2 | 3 | 1-1 | 0 | 2 | 17-21 obr. |
| 3 | 3 | 1-1 | 0 | 2 | 19-23 obr. |
| 4 | 3 | 1-1 | 0 | 2 | 21-26 obr. |
| 5 | 3 | 1-1 | 0 | 2 | 24-30 obr. |

**Zrzut Ziemi** (push): Odpycha cel w linii. Zderzenie z przeszkodą lub jednostką zadaje dodatkowe obrażenia za każdy niewykorzystany kafel.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 1-3 w linii | 3 | 1 | 6-8 obr.; odpycha o 2, zderzenie 4 za kafel |
| 2 | 3 | 1-3 w linii | 3 | 1 | 7-9 obr.; odpycha o 2, zderzenie 5 za kafel |
| 3 | 3 | 1-4 w linii | 2 | 1 | 8-10 obr.; odpycha o 3, zderzenie 5 za kafel |
| 4 | 3 | 1-4 w linii | 2 | 1 | 9-12 obr.; odpycha o 3, zderzenie 6 za kafel |
| 5 | 3 | 1-5 w linii | 2 | 1 | 10-13 obr.; odpycha o 3, zderzenie 7 za kafel |

**Dół** (trap): Kopie dół na kaflu. Kto w niego wpadnie, traci wszystkie punkty ruchu i obrywa.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 4 | 1-2 | 4 | 1 | pułapka 10-14 obr., 3 t., zatrzymuje |
| 2 | 4 | 1-2 | 4 | 1 | pułapka 12-16 obr., 3 t., zatrzymuje |
| 3 | 3 | 1-2 | 4 | 1 | pułapka 14-18 obr., 4 t., zatrzymuje |
| 4 | 3 | 1-3 | 3 | 1 | pułapka 16-21 obr., 4 t., promień 1, zatrzymuje |
| 5 | 3 | 1-3 | 3 | 1 | pułapka 18-24 obr., 5 t., promień 1, zatrzymuje |

### Tropiciel (Łowca)

Poluje w ciemności. Trzyma dystans, zastawia sidła i znika, zanim ktoś go dosięgnie.

**Wygląd i ruch.** Kaptur, chusta na twarzy, długi płaszcz, kusza i kołczan. Skrada się pochylony.

**Start:** życie 46 (+5 za poziom), inicjatywa 40, 6 PA, 3 PM.

**Bełt** (damage, los): Strzał z kuszy. Wymaga linii widzenia.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 3-7, widoczność | 0 | 2 | 11-15 obr. |
| 2 | 3 | 3-7, widoczność | 0 | 2 | 13-17 obr. |
| 3 | 3 | 3-8, widoczność | 0 | 2 | 15-19 obr. |
| 4 | 3 | 3-8, widoczność | 0 | 2 | 17-22 obr. |
| 5 | 3 | 3-9, widoczność | 0 | 2 | 19-25 obr. |

**Sidła** (trap): Zastawia pułapkę. Kto w nią wejdzie, obrywa i traci 2 PM w następnej turze.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 1-5 | 2 | 1 | pułapka 8-12 obr., 4 t., -2 PM, max 2 |
| 2 | 3 | 1-5 | 2 | 1 | pułapka 10-14 obr., 4 t., -2 PM, max 2 |
| 3 | 3 | 1-6 | 2 | 1 | pułapka 12-16 obr., 5 t., -2 PM, max 3 |
| 4 | 2 | 1-6 | 2 | 1 | pułapka 14-19 obr., 5 t., -2 PM, max 3 |
| 5 | 2 | 1-6 | 1 | 1 | pułapka 16-22 obr., 6 t., -2 PM, max 4 |

**Skok w Cień** (position): Odskok do tyłu w linii, ponad jednostkami. Od 4. poziomu zostawia sidła w miejscu startu.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 2 | ty | 4 | 1 | skok o 3 |
| 2 | 2 | ty | 3 | 1 | skok o 3 |
| 3 | 2 | ty | 3 | 1 | skok o 4 |
| 4 | 2 | ty | 3 | 1 | skok o 4, zostawia sidła |
| 5 | 2 | ty | 2 | 1 | skok o 5, zostawia sidła |

### Żałobnik (Mag)

Żałoba to jego broń. Z popiołu i grobów wyciąga ogień, który pamięta poległych.

**Wygląd i ruch.** Wysoka sylwetka, kapelusz z woalem, szata w kolorze żałoby, laska z żarem. Płynie tuż nad ziemią.

**Start:** życie 38 (+4 za poziom), inicjatywa 28, 6 PA, 3 PM.

**Żar** (damage, los): Kula żaru. Przy świeżym grobie obok celu uderza mocniej. Wymaga linii widzenia.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 2-6, widoczność | 0 | 2 | 12-16 obr.; przy grobie +30% |
| 2 | 3 | 2-6, widoczność | 0 | 2 | 14-18 obr.; przy grobie +30% |
| 3 | 3 | 2-7, widoczność | 0 | 2 | 16-20 obr.; przy grobie +35% |
| 4 | 3 | 2-7, widoczność | 0 | 2 | 18-23 obr.; przy grobie +40% |
| 5 | 3 | 2-8, widoczność | 0 | 2 | 21-26 obr.; przy grobie +50% |

**Podmuch Popiołu** (push, los): Odpycha cel w linii i zostawia chmurę popiołu, która zasłania linię widzenia.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 3 | 1-4 w linii | 2 | 1 | 4-6 obr.; odpycha o 3; chmura 1 t. |
| 2 | 3 | 1-4 w linii | 2 | 1 | 5-7 obr.; odpycha o 3; chmura 1 t. |
| 3 | 3 | 1-5 w linii | 2 | 1 | 6-8 obr.; odpycha o 3; chmura 2 t. |
| 4 | 3 | 1-5 w linii | 2 | 1 | 7-10 obr.; odpycha o 4; chmura 2 t. |
| 5 | 3 | 1-6 w linii | 1 | 1 | 8-12 obr.; odpycha o 4; chmura 2 t. |

**Stos Pogrzebowy** (glyph): Zapala stos, który wybucha po turze. Postawiony na grobie zadaje o połowę więcej i pochłania grób.

| Poziom | PA | Zasięg | Odnowienie | Limit na turę | Efekt |
|---|---|---|---|---|---|
| 1 | 4 | 2-5 | 3 | 1 | wybuch po 1 t.: 18-24 obr., promień 1, na grobie +50% |
| 2 | 4 | 2-5 | 3 | 1 | wybuch po 1 t.: 21-28 obr., promień 1, na grobie +50% |
| 3 | 4 | 2-6 | 3 | 1 | wybuch po 1 t.: 24-32 obr., promień 1, na grobie +50% |
| 4 | 4 | 2-6 | 2 | 1 | wybuch po 1 t.: 27-36 obr., promień 1, na grobie +50% |
| 5 | 3 | 2-7 | 2 | 1 | wybuch po 1 t.: 30-40 obr., promień 2, na grobie +50% |

### Przeszłości

| Nazwa | Historia | Bonus |
|---|---|---|
| Dziecko Cmentarza | Wychowałeś się wśród grobów. Martwych się nie boisz, żywych coraz mniej. | +8 życia |
| Wygnaniec z Dróg | Wypędzono cię z trzech miast. W czwartym nikt nie zadaje pytań, a arena nie pyta o przeszłość. | +6 inicjatywy |
| Uczeń Spalonej Biblioteki | Ocalało kilka kart. Resztę znasz na pamięć, i to cię przeraża. | +1 punkt czaru na start |
| Strażnik Zamkniętej Bramy | Pilnowałeś wejścia, aż coś stamtąd wyszło. Teraz schodzisz sprawdzić co. | +2 wytrzymałości |

### Cechy (wybierasz dwie)

| Nazwa | Opis | Plus | Skaza |
|---|---|---|---|
| Twardy | Znosi więcej, wolniej reaguje. | +6 życia | -3 inicjatywy |
| Szybki | Pierwszy w kolejce, kruchszy. | +5 inicjatywy | -4 życia |
| Zawzięty | Bije mocniej, gorzej się osłania. | +3 siły | -2 wytrzymałości |
| Cichy | Celny i zwinny, słabszy w czarach. | +3 zręczności | -2 mocy |
| Naznaczony | Arena zostawiła na nim ślad: moc kosztem życia. | +3 mocy | -4 życia |
| Ostrożny | Odporny, mniej agresywny. | +2 wytrzymałości | -2 siły |

## Kreator postaci

Układ jak w Dofusie, dostosowany do dotyku i poziomu: z lewej klasy, pośrodku podgląd z obrotem i chodem oraz imię z losowaniem, z prawej opcje.
- **Klasa** (3), **płeć** (2), **twarz** (8 wariantów: brwi, oczy, blizna, piegi), **fryzura** (7), **kolor włosów** (12), **karnacja** (6).
- **Kolory stroju**: 3 sloty (strój, wykończenie, akcent), każdy z 12 odcieni.
- **Imię** z przyciskiem losowania i **przeszłość** (jedna z 4, z krótką historią i małym bonusem).
- **Cechy**: wybierasz dwie z sześciu, każda ma plus i skazę (żadna nie jest czystą korzyścią).
- Podsumowanie statystyk na żywo. Bohater to ta sama postać przez całą grę, także po śmierci w arenie.

## Czego ten wygląd nie umie (uczciwie)

Rysunek jest prostszy od Dofusa: mamy sylwetki, kolory i detale, ale nie malowany szczegół, duże ilustrowane portrety ani asymetryczne ubrania. Kreator nie ma portretu-popiersia jak w Dofusie. Jeśli to ma być wyróżnik, to osobne zadanie graficzne (większy rysunek twarzy i ramion).

## Otwarte pytania

Zobacz `docs/PROJEKT.md`, sekcja "Zmiana zakresu".
