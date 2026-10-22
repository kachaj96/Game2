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

- Klasy startowe: ile, jak się różnią (propozycja do omówienia: mag, wojownik, łowca, co pasuje do ról w generatorze postaci).
- Co dokładnie zostaje po porażce: odblokowania klas i czarów, waluta, ulepszenia stałe?
- Współpraca w jednej sieci: odpowiedź użytkownika urwała się na słowie "albo", do dokończenia.
- Fabuła: kim jest bohater, kto prowadzi turniej, czemu bohater wraca po śmierci.
