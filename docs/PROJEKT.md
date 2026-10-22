# Arena Iso: decyzje projektowe

Dokument żyje. Każda decyzja ma datę i powód, żeby dało się ją później zakwestionować.

## Decyzje (22.10.2026)

| Pytanie | Decyzja | Konsekwencja dla kodu |
|---|---|---|
| Rdzeń gry | Serie aren w stylu roguelite: kolejne starcia turowe na siatce, po każdym wybór nagrody | Pierwsza wersja to sama walka i pętla run. Bez wioski do chodzenia, bez eksploracji |
| Gracze | Jedna osoba. Z czasem współpraca ze znajomym w jednej sieci Wi-Fi/LAN (szczegóły do dopowiedzenia) | Logika gry musi być deterministyczna i oddzielona od rysowania, żeby tryb sieciowy dało się dołożyć bez przepisywania |
| Platforma | Telefon i dotyk najpierw | Brak hovera. Sterowanie dotknięciem: pierwsze dotknięcie pokazuje podgląd (ścieżka, zasięg), drugie potwierdza. Duże cele, UI od dołu ekranu |
| Świat i ton | Poważniejszy, mroczniejszy | Styl graficzny zostaje (kontur, geometria), zmienia się nastrój: przygaszona paleta, wieczorne i nocne światło, mgła, świecące okna |

## Decyzje, runda 2 (22.10.2026)

| Pytanie | Decyzja | Konsekwencja |
|---|---|---|
| Skład | Jeden bohater. Na początku gry wybór klasy, personalizacja wyglądu, startowe umiejętności | Kreator postaci to edycja specyfikacji z `genCharacter` (karnacja, fryzura, kolory, strój), więc generator już to umie. Klasa wyznacza rolę i czary startowe |
| Porażka | Częściowy postęp zostaje | Run kończy się utratą bieżącego stanu, ale odblokowania i część zasobów zostają. Trzeba dopowiedzieć, co dokładnie |
| Mechaniki | Odpychanie, linia widzenia i osłony, pułapki i glify, odnowienia i ograniczone punkty | Wszystkie cztery. Kolejność wdrażania poniżej |
| Fabuła | Pogrzebana arena | Szkic niżej |

**Kolejność mechanik (ryzyko zakresu).** Cztery naraz to pełna głębia Dofusa, więc budujemy warstwami, każda sprawdzana w grze, zanim dojdzie następna: 1. PM i PA z odnowieniami (jest ruch, zostają czary), 2. linia widzenia i osłony, 3. odpychanie i pozycjonowanie, 4. pułapki i glify. Pułapki ostatnie, bo zależą od wszystkiego innego.

**Szkic fabuły: Pogrzebana arena.** Pod ruinami miasta leży arena, na której pokonani wracają jako przeciwnicy. Bohater schodzi coraz głębiej, by dowiedzieć się, kto prowadzi turniej i czemu nikt z niego nie wrócił. Pozorna śmierć i kolejne runy mają w świecie sens: każdy powrót to kolejne zejście. Tekst gry nie zdradza zwrotów fabuły z góry, odkrywają się wraz z postępem.

## Decyzje, runda 3 (22.10.2026)

| Pytanie | Decyzja | Konsekwencja |
|---|---|---|
| Klasy na starcie | Wojownik, Łowca, Mag | Trzy zestawy czarów do zaprojektowania. Role istnieją już w generatorze postaci. Dalsze klasy (np. nekromanta, pasujący do fabuły) jako odblokowania |
| Co zostaje po porażce | Odblokowane klasy i czary, waluta na stałe ulepszenia, start od głębszego piętra | Meta-postęp zapisywany lokalnie, osobno od stanu runu. Zob. napięcie niżej |
| Długość runu | Krótki: 5 do 6 aren, ok. 15 minut | Mało aren, więc każda musi być wyrazista. Mniej treści do wytworzenia na start |
| Współpraca | Przez internet z kodem pokoju (docelowo, nie teraz) | Potrzebny mały serwer pośredniczący. Każdy gracz ma swojego bohatera, więc "jeden bohater" zostaje. Logika deterministyczna jest warunkiem, serwer dopiero na końcu |

**Napięcie 1: start od głębszego piętra kontra run 5 do 6 aren.** Przy tak krótkim runie pominięcie kilku aren usuwa większość rozgrywki. Propozycja do zatwierdzenia: skrót tylko po pokonaniu bossa danego piętra i tylko do połowy runu, a nie na dowolną głębokość.

**Napięcie 2: waluta na stałe ulepszenia.** Przy krótkich runach łatwo o grind, w którym liczy się liczba podejść, nie umiejętność. Do rozstrzygnięcia: ulepszenia dają szerokość (więcej opcji), a nie siłę (więcej obrażeń).

## Decyzje, runda 4 (22.10.2026)

| Pytanie | Decyzja | Konsekwencja |
|---|---|---|
| Zakres | Hybryda w fazach | Stały bohater i świat, Pogrzebana arena jako loch 5 do 6 komnat. Fazy: 1 walka i klasy, 2 mała mapa, 3 zbieranie i crafting, 4 profesje. Każda faza sprawdzana w grze |
| Klasy | Grabarz, Tropiciel, Żałobnik zatwierdzone (nazwy, wygląd, styl ruchu) | Dalej tylko strojenie liczb po walkach |
| Groby | Wchodzą jako wyróżnik | Pokonana jednostka zostawia grób: blokuje ruch i linię widzenia, jest paliwem czarów |
| PA i PM | 6 i 3 bez zmian | Różnicę względem Dofusa dają groby i zasady czarów |

**Kolejność czarów (każda warstwa z testami):** 1. obrażenia, zasięg, linia, odnowienia, limity, PA, śmierć i groby, linia widzenia. 2. odpychanie z kolizją. 3. pułapki i glify. Czar, którego efekt jeszcze nie jest zaimplementowany, jest w interfejsie wyszarzony, a logika go odrzuca, żeby nie udawać, że działa.

## Decyzje, runda 5 (22.10.2026)

| Pytanie | Decyzja |
|---|---|
| Żywioły | Cztery plus neutralny: Ziemia, Ogień, Woda, Powietrze, Zwykłe |
| Statystyki | Witalność i moc każdego żywiołu (5 punktów za poziom, koszt rośnie z wartością) |
| Pasek czarów | Skróty ze stronami (6 widocznych) i Księga Czarów |
| Odporności wroga | Odkrywane w trakcie: widoczne po pierwszym trafieniu danym żywiołem |

Budowa według `docs/PLAN_ZYWIOLY.md`, fazy A, C, D, B, E.

## Plan żywiołów, statystyk i paska czarów
Zatwierdzony w rundzie 5, opisany w `docs/PLAN_ZYWIOLY.md`. Odpychanie z kolizją i chmury popiołu są już zbudowane (warstwa 2 czarów).

## Zmiana zakresu (rozstrzygnięta: hybryda w fazach)

Po rundzie 3 użytkownik napisał: chcę grę Dofus-like, więc świat i eksploracja są ważne, areny również, ale gracz ma mieć eksplorację, profesje, crafting i więcej. To zmienia projekt z serii aren w RPG ze światem. Wcześniejsze decyzje o postępie po porażce, o jednym bohaterze i o tej samej postaci po śmierci pasują do takiego RPG, a seria aren staje się rodzajem lochu.

**Propozycja hybrydy.** Stały bohater i świat do eksploracji. Pogrzebana arena to loch na 5 do 6 komnat (ok. 15 minut), do którego się schodzi: porażka oznacza utratę łupów z zejścia, ale nie postaci, ekwipunku i poziomu. Skrót od głębszego piętra działa po pokonaniu bossa.

**Ryzyko.** Dofus to setki godzin treści zrobionych przez duży zespół. Trzy duże systemy (świat, profesje, crafting) zbudowane obok walki mogą przez miesiące nie dać odpowiedzi, czy walka jest zabawna. Dlatego fazy, każda sprawdzana w grze:

1. Walka, klasy, kreator, jedna arena do zejścia (zasada: najpierw sprawdzamy, czy walka daje frajdę).
2. Mała mapa nadziemna: chodzenie, kilku mieszkańców, wejście do areny.
3. Zbieranie surowców, crafting i ekwipunek, który daje PA i PM (to spina się z założeniem, że PA i PM rosną z ekwipunku).
4. Dalsze profesje i regiony.

Do rozstrzygnięcia przez autora: potwierdzenie hybrydy i kolejności faz, wybór pierwszych profesji.

## Odkrycia z prototypu walki (22.10.2026)

- **Izometria jest szeroka, więc telefon w pionie marnuje ponad połowę ekranu.** Walka powinna być w poziomie, interfejs jako nakładki na planszy, nie paski. W pionie zostają menu. Plansza 7x7 w poziomie ma kafel ok. 62 px szerokości, co jest granicą wygody dla dotyku.
- Przy większych arenach potrzebny będzie przesuw i przybliżenie kamery.
- Test logiki nie wykrył rozciągniętego obrazu ani za małej planszy. Układ trzeba sprawdzać w przeglądarce z emulacją telefonu (`npm run e2e`).

## Zasady wynikające z decyzji

1. **Stan gry to czysta funkcja.** Cała logika (ruch, czary, tury, losowość) mieszka w `src/game/` i nie dotyka canvasa, DOM ani `Math.random()`. Losowość tylko przez zasiane `rng`. Dzięki temu ten sam przebieg odtwarza się z ziarna i listy komend, co wystarcza do testów, powtórek i późniejszej współpracy sieciowej (obie strony liczą to samo).
2. **Wszystko, co zmienia stan, to komenda** (`{typ:'ruch', jednostka, cel}`), walidowana i zapisywana. Interfejs tylko wysyła komendy. Sieć później wyśle te same komendy.
3. **Dotyk jest podstawą.** Każda funkcja musi działać bez najechania myszą. Mysz dochodzi jako dodatek.
4. **Co najpierw:** siatka (jest), ruch z A* i punktami ruchu, kolejka tur, jeden czar z zasięgiem i linią widzenia, jedna arena grywalna, wybór nagrody. Dopiero wtedy ocena, czy to jest zabawne.

## Ryzyka (do sprawdzenia, nie do założenia)

- **Ton kontra styl graficzny.** Kolorowy, wyraźny styl w stylu Dofusa nie daje z automatu mrocznego nastroju. Trzeba to osiągnąć oświetleniem i paletą, nie zmianą kształtów. Do zrobienia: parametr nastroju w generatorach i nakładka kolorystyczna.
- **Roguelite bez zawartości nudzi po trzech runach.** Zawartość (wrogowie, czary, nagrody) musi być generowana z danych, tak jak grafika, inaczej wąskim gardłem będzie ręczne pisanie.
- **Współpraca w jednej sieci z poziomu przeglądarki lub aplikacji mobilnej** nie jest trywialna: telefon nie otwiera serwera. Wchodzi w grę WebRTC z ręcznym parowaniem (kod QR). Nie projektujemy tego teraz, ale logika deterministyczna jest warunkiem koniecznym.

## Otwarte pytania

- Postacie: użytkownik chce dopisać własne uwagi po serii odpowiedzi (kreator, tożsamość bohatera, różnice między klasami). Czekamy na to przed projektowaniem czarów.
- Czary klas Wojownik, Łowca, Mag: koszt PA, zasięg, odnowienie, efekt. Do zaprojektowania po uwagach o postaciach.
- Dwa napięcia z rundy 3 (skrót od głębszego piętra, waluta na ulepszenia).
- Fabuła: kim jest bohater, kto prowadzi turniej, czemu bohater wraca po śmierci.
