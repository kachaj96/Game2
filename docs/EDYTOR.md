# Edytor kolizji: instrukcja

Adres: https://kachaj96.github.io/Game2/www/edytor-kolizji.html?map=las (albo `?map=wioska`).
Lokalnie: `npm start`, potem http://127.0.0.1:8080/www/edytor-kolizji.html?map=las.
Nie otwieraj pliku z dysku (file://) ani w aplikacji APK: moduły się nie załadują i przyciski nie zadziałają. Strona pokaże wtedy czerwony komunikat.

## Podstawy
- Dwa palce lub kółko myszy: zoom. Przeciąganie w trybie Ręka: przesuwanie mapy. Przyciski + − Dopasuj w panelu.
- Czerwone kafle to maska kolizji (tam postać nie wejdzie). Biała linia to granica obszaru, po którym wolno chodzić.
- Cofnij i Ponów są w panelu. Każda zmiana zapisuje się sama jako wersja robocza w tej przeglądarce.

## Tryby
- Kafle: maluj palcem. Blokuj = czerwony, Odblokuj = zielony (wymusza wolne pole), Gumka = wraca do wyniku z kształtów. Najszybsza poprawka drobnych błędów.
- Obiekty: Nowy obiekt, potem obrysuj jego podstawę (stopy, miejsce, gdzie stoi na ziemi) kolejnymi dotknięciami. Druga część to sylwetka (obrys całego obiektu, wyższy), dzięki niej postać chowa się za dachem lub drzewem.
- Obszar: obrys terenu, po którym wolno chodzić.
- Punkty: start, wyjścia, NPC. Przeciągnij punkt w nowe miejsce.

## Test i wysyłka
1. Testuj w grze otwiera mapę z wersją roboczą.
2. Pobierz JSON (albo Kopiuj JSON) i wklej mi w czacie lub wrzuć plik. Wersja robocza siedzi tylko w Twojej przeglądarce, ja jej nie widzę.
3. Wróć do pliku kasuje wersję roboczą i wczytuje oryginał.
