# Arena Iso: decyzje projektowe

Dokument żyje. Każda decyzja ma datę i powód, żeby dało się ją później zakwestionować.

## Decyzje (22.10.2026)

| Pytanie | Decyzja | Konsekwencja dla kodu |
|---|---|---|
| Rdzeń gry | Serie aren w stylu roguelite: kolejne starcia turowe na siatce, po każdym wybór nagrody | Pierwsza wersja to sama walka i pętla run. Bez wioski do chodzenia, bez eksploracji |
| Gracze | Jedna osoba. Z czasem współpraca ze znajomym w jednej sieci Wi-Fi/LAN (szczegóły do dopowiedzenia) | Logika gry musi być deterministyczna i oddzielona od rysowania, żeby tryb sieciowy dało się dołożyć bez przepisywania |
| Platforma | Telefon i dotyk najpierw | Brak hovera. Sterowanie dotknięciem: pierwsze dotknięcie pokazuje podgląd (ścieżka, zasięg), drugie potwierdza. Duże cele, UI od dołu ekranu |
| Świat i ton | Poważniejszy, mroczniejszy | Styl graficzny zostaje (kontur, geometria), zmienia się nastrój: przygaszona paleta, wieczorne i nocne światło, mgła, świecące okna |

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

- Skład: jeden bohater, drużyna, czy bohater z kompanem?
- Konsekwencje porażki: trwała śmierć, częściowy postęp między runami, czy w ogóle bez kary?
- Mechaniki taktyczne, które ta walka ma mieć (odpychanie, linia widzenia, pułapki, czas odnowienia).
- Zarys fabuły.
