# Plan: interfejs w klimacie Dofusa (do akceptacji)

Status: **zatwierdzony**. Decyzje autora: kreator bliżej Dofusa 1:1 (rząd klas na dole, sloty na kolejne klasy), kolejka tur w lewym górnym rogu, ramki mroczne (kute żelazo i kość z mosiężnym akcentem), kolejna rodzina wrogów to owady i pajęczaki.
Zrobione: twarze i różnice płci, środek kafla, oprawa `src/art/ui.js`, kreator ze sceną i rzędem 8 slotów klas (3 gotowe, 5 zablokowanych), ramki w walce, kolejka tur. Zostaje: strzałki ‹ › przy częściach wyglądu i interfejs wyglądu dla nie-humanoidów.

## Wnioski z uwag
- Kreator to teraz zakładki z przyciskami. Dofus to **duża postać na scenie**, klasy jako **duże portrety/emblematy**, wybór części przez **strzałki** i **palety kolorów**, ozdobna ramka. Brakuje nam nastroju i "wow" przy pierwszym uruchomieniu.
- Walka ma poprawną funkcję, ale wygląda jak prototyp: zwykłe czarne pigułki zamiast oprawy gry.
- Kolejne postacie (wrogowie, kompani, zwierzaki, kolejne klasy) nie muszą być humanoidami. Kreator i walka nie mogą zakładać "głowa, tułów, dwie ręce".

## 1. Oprawa wspólna (tani, duży efekt)
- Jeden zestaw elementów graficznych rysowany kodem (`src/art/ui.js`): ramka z ciemnego drewna z mosiężnymi narożnikami, panel pergaminowo-ciemny, guzik z wypukłością, ikony statystyk (serce, gwiazda, but), ozdobne nagłówki.
- Paleta jak w grze: ciemny brąz, mosiądz, żar. Bez zmiany kształtów generatorów.

## 2. Kreator (landscape)
- Środek: **duża postać** na kolistym podeście z poświatą w kolorze klasy, tło z motywem areny (łuk, kraty, pochodnie). Obrót strzałkami po bokach.
- Lewy bok: klasy jako **trzy duże medaliony** z emblematem i nazwą (jak pasek klas w Dofusie), po wybraniu opis i czary klasy pod spodem.
- Prawy panel: zakładki zostają (to rozwiązanie na małym ekranie), ale każda część wyglądu ma **strzałki ‹ ›** do przeglądania i nazwę wyboru ("Głowa 3/8"), kolory jako **okrągłe próbki w ramkach**. Przycisk "Losuj" jako kostka.
- Dół: pole imienia i duży przycisk "Zejdź do areny".

## 3. Walka (bez przesady)
- Górny lewy róg: **kolejka tur** jako rząd małych portretów (jak w Dofusie): kto teraz, kto po kim. Po dotknięciu portretu pokazuje się karta jednostki.
- Zamiast tekstu "Życie 18/70 PM 3/3 PA 6/6": trzy **bańki** (serce, gwiazda PA, but PM) z liczbami, po prawej stronie paska czarów.
- Pasek czarów i przycisk "Koniec tury" w nowej ramie, zegar tury jako pierścień na przycisku (na razie bez limitu czasu, tylko wygląd).
- Plansza, kolory kafli i zasięg bez zmian.

## 4. Różnorodność postaci (nie tylko humanoidy)
- Wprowadzam wspólny **interfejs wyglądu**: każda istota ma `kind` (humanoid, stwór, ...) i własny generator `gen...`/`draw...`. Walka i kolejka tur rysują po `kind`, bez założeń o kończynach.
- Kolejna rodzina po Kopaczach (stworzenia, już są): do wyboru np. owady/pajęczaki, kamienne golemy, kościotrupy, zjawy, rośliny. Każda inna sylwetka, inne ruchy (pełzanie, lewitacja, skoki).
- Portret w kolejce tur rysowany z tego samego generatora (zbliżenie na "twarz").

## Kolejność
1. Oprawa wspólna i walka (kolejka tur, bańki, ramy).
2. Kreator: scena, medaliony klas, strzałki.
3. Interfejs wyglądu dla różnych `kind` przy okazji pierwszych nie-humanoidalnych wrogów.

## Pytania
1. Kreator: scena i medaliony jak powyżej, czy wolisz układ bliższy Dofusowi 1:1 (klasy w rzędzie na dole)?
2. Kolejka tur w walce: tak, w lewym górnym rogu?
3. Styl ramek: ciemne drewno z mosiądzem (Dofus-like, ciepłe), czy raczej kute żelazo i kość (mroczniej, bliżej "Pogrzebanej areny")? Proponuję żelazo i kość z mosiężnym akcentem.
4. Które nie-humanoidalne rodziny cię najbardziej kręcą? To zdecyduje o kolejnych lochach.
