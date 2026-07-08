# 🏪 Kiosk Simulator 3D

Ein vollständig spielbarer 3D-Kiosk-Shop-Simulator – komplett offline, komplett fiktiv, komplett prozedural.

---

## A. Engine- und Sprachwahl: Three.js + JavaScript (Vite)

**Warum Three.js statt Godot/Unity/Unreal?**

| Kriterium | Three.js |
|---|---|
| Direkt spielbar | ✅ Läuft sofort im Browser – kein Engine-Download, kein Editor, kein Export |
| Prozedurale 3D-Objekte | ✅ Geometrie direkt im Code (Zylinder, Boxen, Lathe etc.) |
| Prozedurale Texturen | ✅ Canvas-2D-API erzeugt alle Texturen zur Laufzeit |
| Icons | ✅ Canvas-generierte Data-URLs |
| Sounds | ✅ WebAudio-Synthesizer, keine Audiodateien nötig |
| UI | ✅ HTML/CSS – das beste UI-System überhaupt |
| Speichern/Laden | ✅ localStorage, kein Dateisystem-Setup |
| Externe Abhängigkeiten | ✅ Nur `three` (Laufzeit) + `vite` (Dev-Server/Bundler) |
| Offline spielbar | ✅ Nach `npm run build` reine statische Dateien |

Unity/Unreal/Godot benötigen Binär-Assets, Szenen-Dateien und Editor-Setups, die sich nicht vollständig als Quellcode ausliefern lassen. Hier ist **jede einzelne Datei lesbarer Code** – nichts Binäres, keine Marken-Assets, keine Downloads.

---

## B. Setup-Anleitung

Voraussetzung: [Node.js](https://nodejs.org) ≥ 18.

```bash
git clone <dieses-repo>
cd kiosk-simulator-game
npm install
npm run dev
```

Dann `http://localhost:5173` im Browser öffnen → **Neues Spiel** klicken → spielen.

**Produktions-Build** (statische Dateien in `dist/`, offline lauffähig über jeden Webserver):

```bash
npm run build
npm run preview   # lokaler Test des Builds
```

### Steuerung

| Taste | Aktion |
|---|---|
| **WASD** | Bewegen |
| **Maus** | Umsehen (Klick ins Spiel = Mauszeiger fangen) |
| **E** | Interagieren (Kasse, Regal, Lotto, Paketschalter, Kartons …) |
| **TAB** | Tablet öffnen (Bestellen, Lager, Preise, Upgrades, Speichern) |
| **ESC** | Panel schließen / Pausemenü |

---

## C. Ordnerstruktur

```
kiosk-simulator-game/
├── index.html              # Hauptmenü, Pausemenü, HUD, Panel-Container
├── package.json            # three + vite, Scripts: dev/build/preview
├── src/
│   ├── main.js             # Einstiegspunkt, Menü-Verdrahtung
│   ├── core/
│   │   ├── Game.js         # Zentraler Orchestrator (Szene, Loop, Systeme)
│   │   ├── Player.js       # First-Person-Steuerung + Kollision + Raycast
│   │   ├── GameClock.js    # Tagesablauf 08:00–22:00, Nachfrage-Zeitkurve
│   │   ├── SaveSystem.js   # Speichern/Laden via localStorage
│   │   ├── SoundSystem.js  # WebAudio-Platzhalter-Sounds (12 Effekte)
│   │   └── Events.js       # EventBus
│   ├── world/
│   │   ├── Textures.js     # Prozeduraler Textur-Generator (Canvas)
│   │   ├── Materials.js    # Material-Bibliothek (~25 Materialien)
│   │   ├── Icons.js        # Produkt-/UI-Icon-Generator (Canvas)
│   │   ├── ProductMeshes.js# Prozedurale Produkt-3D-Modelle (11 Typen)
│   │   └── KioskBuilder.js # Kompletter begehbarer Kiosk
│   ├── systems/
│   │   ├── Economy.js      # Geld, XP, Level, Ruf, Preise, Tagesabschluss
│   │   ├── Inventory.js    # Lager + Regalbestand + Auffüllen
│   │   ├── Ordering.js     # Bestellsystem + Lieferungen + Kartons
│   │   ├── Packages.js     # Paketannahme + Abholung mit Codes
│   │   ├── Lotto.js        # Fiktives Lotto: Scheine, Ziehung, Rubbellose
│   │   └── Upgrades.js     # 25 Upgrades: Kauf, Effekte, sichtbare Änderungen
│   ├── ai/
│   │   ├── Customer.js     # Kunden-Zustandsmaschine
│   │   └── CustomerManager.js # Spawning, Warteschlange, Automation
│   ├── data/
│   │   ├── products.js     # 45 fiktive Produkte (Datenbank)
│   │   ├── upgrades.js     # 25 Upgrades (Datenbank)
│   │   └── customers.js    # 11 Kundentypen + Levelsystem
│   └── ui/
│       ├── UI.js           # HUD + alle Panels (Kasse, Tablet, Lotto …)
│       └── style.css       # Komplettes Stylesheet
└── README.md
```

---

## D–L. Systeme im Überblick

### Spielablauf (verifiziert lauffähig)

1. Kunden spawnen draußen, betreten den Laden durch die Tür (mit Türglocke).
2. Jeder Kunde plant nach Typ einen Einkauf (normal, eilig, Stammkunde, Paketkunde, Lotto-Kunde, Tabak-Kunde, minderjährig, Großeinkauf, ungeduldig, Tourist, Dieb).
3. Kunden laufen zum passenden Regal, nehmen Produkte (sichtbar aus dem Regal!), reagieren auf leere Regale.
4. Kunden stellen sich an der Kasse an – Ungeduldige verlassen genervt die Schlange.
5. Spieler geht zur Kasse (E) → Kassen-Panel: **Artikel scannen**, dann **Bar** oder **Karte** (Upgrade).
6. Tabak-Kunden lösen die **Altersprüfung** aus: Ausweis zeigt Geburtsjahr → Verkaufen oder Ablehnen. Verkauf an Minderjährige = Strafe + Rufverlust; korrektes Ablehnen = Rufbonus.
7. Lotto-Kunden am Terminal (fiktiv!): Zahlenschein mit Ziehung oder Rubbellos mit Symbolen, 40 % Provision.
8. Paketkunden: Annahme (scannen → Paketregal) und Abholung (Abholcode prüfen – falsche Ausgabe = Strafe).
9. **TAB** → Tablet: Ware bestellen (Lieferung nach ~90 Spielminuten als Kartons im Lager), Lagerbestand einsehen, **Verkaufspreise einstellen** (beeinflusst Nachfrage), Upgrades kaufen, speichern.
10. Kartons im Lager mit E auspacken → Ware ins Lager → Regale mit E auffüllen.
11. 22:00 Uhr: **Tagesabschluss** mit Umsatz, Wareneinsatz, Miete, Strom, Lieferkosten, Strafen, Gewinn, XP.
12. Level-Aufstiege schalten Produktkategorien und Upgrades frei (Level 1–10).

### Wirtschaft
Startkapital 500 €, Miete + Strom pro Tag, Nachfrage abhängig von **Preisfaktor, Uhrzeit (Morgen-/Abendspitzen), Ruf und Verfügbarkeit**. XP → Level → Freischaltungen. Ruf (0–100) beeinflusst Kundenaufkommen.

### Speichern & Laden
Speichert Geld, Tag, Uhrzeit, Level, XP, Ruf, Lager- und Regalbestand, aktive Upgrades (inkl. sichtbarer Ladenveränderungen), Paketbestand, offene Bestellungen/Kartons, individuelle Verkaufspreise und Spielerposition in `localStorage`.

---

## F/G. Asset-, Textur- und Material-Generator

**Alles wird zur Laufzeit im Code erzeugt – null Binärdateien:**

- **`Textures.js`** zeichnet mit der Canvas-2D-API: gekachelter Fliesenboden, Wandputz mit Sockelleiste, Holz mit Maserung, Karton mit Klebeband, Metall, Asphalt, Zeitungspapier und **Produktetiketten mit Namen** – als `CanvasTexture`.
- **`Materials.js`** kombiniert Texturen mit `MeshStandardMaterial` (Roughness/Metalness pro Materialtyp: Glas transparent, Metall glänzend, Karton matt …).
- **`ProductMeshes.js`** baut 11 Modelltypen (Flasche mit Deckel, Dose, Becher, Tüte, Riegel, kleine Schachtel, Zeitung, Stab, Karte, Geschenkbox) aus Primitiven mit Etiketten-Textur – gecacht pro Produkt.
- **`Icons.js`** rendert für jedes Produkt ein 64×64-Icon (Form + Farbe + Initiale) als Data-URL für die UI.
- **`SoundSystem.js`** synthetisiert Türglocke, Scanner-Beep, Kassen-Kaching, Münzen, Kartenzahlung, Paket-Scan, Lotto-Jingle, zufrieden/unzufrieden und Tagesabschluss per WebAudio-Oszillatoren.

### Assets später ersetzen

- **3D-Modelle**: In `ProductMeshes.js` den jeweiligen `case` durch einen `GLTFLoader`-Aufruf ersetzen (three.js `examples/jsm/loaders/GLTFLoader.js` ist bereits im Paket enthalten). Rückgabe muss eine `THREE.Group` sein.
- **Texturen**: In `Materials.js` `new THREE.TextureLoader().load('pfad.png')` statt der Canvas-Textur übergeben.
- **Icons**: In `Icons.js` die Data-URL durch Bildpfade ersetzen.
- **Sounds**: In `SoundSystem.js` die Synthesizer-Definition durch `new Audio('pfad.ogg').play()` ersetzen – die Aufruf-API (`sound.play('scanner')`) bleibt identisch.

---

## H/I. Datenbanken

- **`src/data/products.js`** – 45 fiktive Produkte in 23 Kategorien (Wasser, Softdrinks, Energy, Kaffee, Chips, Schokolade, Bonbons, Kaugummi, Eis, Zeitungen, Magazine, fiktive Tabakwaren, fiktive E-Zigaretten, Feuerzeuge, fiktive Lotto-Scheine, Rubbellose, Prepaid, Handy-Zubehör, Batterien, Hygiene, Paketmarken, Geschenke, Saison). Jedes Produkt: ID, Name, Kategorie, EK/VK, Lager-/Regalgröße, Nachfrage, Freischaltlevel, Altersbeschränkung, Lotto-Flag, Modelltyp, Material, Farbe, Icon.
- **`src/data/upgrades.js`** – 25 Upgrades mit ID, Name, Beschreibung, Kosten, Voraussetzung, Level, Effekt und sichtbarer Ladenveränderung.
- **`src/data/customers.js`** – 11 Kundentypen mit Geduld, Budget, Verhalten; Levelkurve 1–10 mit Freischaltungen.

**Alle Namen sind frei erfunden** (z. B. „Quellperle Still", „Blitzfunke Energy", „Rauchwolke Blau (fiktiv)"). Lotto & Tabak sind reine Spielmechanik ohne Bezug zu echten Marken oder echtem Glücksspiel.

---

## M. Testanleitung

1. `npm run dev` → Browser → **Neues Spiel**.
2. In den Laden schauen (Maus), mit WASD zum Getränkeregal laufen.
3. Warten bis Kunden kommen (ab ~08:05) – sie nehmen sichtbar Produkte aus Regalen.
4. Zur Kasse (rechts vorn), **E** → alle Artikel scannen → **Bar kassieren**. Geld steigt.
5. **TAB** → Tab „Bestellen" → z. B. 10× Wasser bestellen → Geld sinkt, Lieferung angekündigt.
6. Nach ~1,5 Spielstunden erscheint ein Karton im Lager (Raum hinten links) → **E** zum Auspacken.
7. Zum leeren Regal, **E** → „Auffüllen" → Produkte erscheinen wieder im Regal.
8. **TAB** → „Upgrades" → z. B. Kartenzahlung kaufen (sichtbares Terminal an der Kasse).
9. **TAB** → „Speichern" → Seite neu laden → **Spiel laden** → Zustand ist wiederhergestellt.
10. Um 22:00 Uhr erscheint der Tagesabschluss automatisch.

Automatischer Smoke-Test: `npm run build` muss fehlerfrei durchlaufen.

---

## N. Erweiterungshinweise

- **Neue Produkte**: Eintrag in `products.js` genügt – Modell, Icon, Material, Regalzuordnung und Bestell-UI entstehen automatisch.
- **Neue Upgrades**: Eintrag in `upgrades.js` + optional `visual`-Key in `KioskBuilder.upgradeVisuals`.
- **Neue Kundentypen**: Eintrag in `customers.js` (Gewicht, Geduld, Verhalten) – die Zustandsmaschine übernimmt den Rest.
- **Mitarbeiter-Erweiterung**: `CustomerManager.autoServe` zeigt das Muster (Mitarbeiter-Kasse-Upgrade bedient Kunden automatisch).
- **Mehr Läden / Straße**: `KioskBuilder.buildOutside()` erweitern.
- **Echte Assets**: siehe Abschnitt F/G – Loader-Aufrufe sind vorbereitet.
- **Mobile/Touch**: Pointer-Lock durch virtuellen Joystick ersetzen (`Player.js` kapselt die gesamte Eingabe).
