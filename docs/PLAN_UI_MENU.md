# Plan interfejsu (menu, postać, opcje)

Stan: w świecie są dwa przyciski (Postać, Menu), panel menu z opcjami i licznik FPS. Funkcje są, wygląd tymczasowy. Docelowo UI w stylu Dofusa.

## Docelowy układ (poziom, dotyk)
- Dół ekranu: pasek skrótów (po lewej zdrowie i XP w kulach, po środku skróty czarów w walce, po prawej przyciski menu).
- Prawy dolny róg: ikony zakładek jak w Dofusie: Postać, Ekwipunek (później), Czary, Mapa, Zadania (później), Opcje.
- Prawy górny róg: minimapa (jest). Lewy górny: nazwa krainy i poziom (jest).
- Opcje: jakość grafiki, pora dnia, licznik FPS (są); dalej dźwięk, język, rozmiar interfejsu, sterowanie lewą ręką.

## Zasady
- Żadnej funkcji zależnej od najechania myszą, przyciski min. 44 px, nakładki nie przechwytują dotyku poza przyciskami.
- Ustawienia w `src/game/settings.js` (`arena.settings.v1`), nowe opcje dopisujemy tam wraz z walidacją i testem.
- Jakość: `QUALITY` (rozdzielczość cieni, dekoracje, smugi, woda, dym, limit DPR). Nowy kosztowny efekt musi mieć wpis w presetach.
