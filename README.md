# MyCars — Evidence vozidel

**Verze:** 3.2  
**Autor:** kraah  
**Typ:** Jednoduchá offline webová aplikace (single HTML file)

---

## O aplikaci

MyCars je offline nástroj pro evidenci vozidel, servisních záznamů a tankování. Vše běží přímo v prohlížeči — žádný server, žádná registrace, žádná data nikam neodesílaná. Data jsou uložena v `localStorage` prohlížeče pod klíčem `autoservis_v3`.

Aplikace je dostupná jako jediný soubor `MyCars.html`, který lze otevřít přímo v prohlížeči přes `file://`.

---

## Funkce

| Stránka | Popis |
|---|---|
| **Přehled** | Aktuální stav vozidla, upozornění na expirace dokladů, poslední tankování |
| **Záznamy** | Servisní záznamy — datum, km, kategorie, cena, poznámka |
| **Tankování** | Evidence paliva — litry, cena, typ paliva, plná nádrž |
| **Analytika** | Grafy výdajů dle kategorie a měsíce, statistické karty |
| **Připomínky** | Opakované události podle km nebo data |
| **Nastavení** | Export/Import JSON zálohy, CSV import, přepnutí jazyka, smazání dat |

---

## Datový model

### Vozidlo
- Základní údaje: značka, model, rok, SPZ, VIN, typ paliva, barva
- Doklady: STK, Emise, POV, Havarijní pojištění (datum + počet dní pro varování)
- Servis: interval oleje, poslední výměna (km), upozornění

### Záznamy kategorií (19 kategorií)
`Nákup vozidla` · `Pojištění` · `Poplatky` · `Vybavení` · `Olej` · `Filtry` · `Pneumatiky` · `Brzdy` · `Nápravy` · `Ložiska` · `Světla` · `Stěrače` · `Elektroinstalace` · `Chladicí směs` · `Náplň do ostřikovačů` · `Práce` · `STK` · `Karoserie` · `Ostatní`

> ⚠️ **Poznámka:** Kategorie `Nákup vozidla` je v analytice vyčleněna do samostatné bubliny a nezapočítává se do ceny za km.

---

## Export a import

### JSON záloha
- **Export:** Nastavení → Exportovat zálohu → stáhne soubor `mycars_YYYY-MM-DD-HHMMSS.json`
- **Import:** Nastavení → Importovat zálohu → načte JSON soubor (**přepíše stávající data**)

### CSV import
Import historických dat ze souborů CSV (např. export z Google Sheets).

---

## Formát CSV souborů

### Servisní záznamy

**Název souboru:** libovolný `.csv`  
**Kódování:** UTF-8  
**Oddělovač:** čárka (`,`)

| Sloupec | Povinný | Formát | Poznámka |
|---|---|---|---|
| `Datum` | doporučený | `DD.MM.RRRR` | Prázdné datum → řádek importován s varováním |
| `Stav tachometru` | ne | číslo (může mít mezery a `\xa0` jako oddělovač tisíců) | |
| `Popis` | ano | text | |
| `Součástky` | ne | číslo | Počet kusů (výchozí: 1) |
| `Jednotková cena` | ne | číslo s čárkou jako des. oddělovačem, může obsahovat `Kč` a `\xa0` | |
| `Celková cena` | ano | číslo s čárkou jako des. oddělovačem, může obsahovat `Kč` a `\xa0` | |
| `Kategorie` | ne | text (přesný název kategorie, viz seznam výše) | Prázdná → doplní se `Ostatní` |

**Příklad:**
```
Datum,Stav tachometru,Popis,Součástky,Jednotková cena,Celková cena,Kategorie
5.9.2022,245 448,Výměna oleje Castrol,7,"231,43","1 620,01",Olej
5.9.2022,245 448,Olejový filtr MANN,1,"315,00","315,00",Filtry
5.9.2022,245 448,STK,1,"3 500,00","3 500,00",STK
```

---

### Tankování

**Název souboru:** libovolný `.csv`  
**Kódování:** UTF-8  
**Oddělovač:** čárka (`,`)

| Sloupec | Povinný | Formát | Poznámka |
|---|---|---|---|
| `Datum` | doporučený | `DD.MM.RRRR` | |
| `Typ paliva` | ne | text | viz tabulka typů paliva níže |
| `Tankováno litrů` | ano | číslo s čárkou | |
| `Cena za litr` | ne | číslo s čárkou, může obsahovat `Kč` a `\xa0` | |
| `Celková cena` | ano | číslo s čárkou, může obsahovat `Kč` a `\xa0` | |
| `Stav tachometru` | ne | číslo, může mít `\xa0` jako oddělovač tisíců | |
| `Km/tankování` | ne | ignorováno (přepočítáváno interně) | |
| `Prům. spotřeba` | ne | ignorováno; `Nelze spočítat` je také akceptováno | |
| `Plná nádrž` | ne | `Ano` / `Ne` | |
| `Poznámka` | ne | text | |

#### Mapování typů paliva

| Hodnota v CSV | Interní typ |
|---|---|
| `Natural 95`, `E10` | Natural 95 (E10) |
| `Super 98` | Super Plus 98 |
| `Diesel`, `Diesel Premium` | Diesel / Diesel Premium |
| `LPG` | LPG |
| `Elektřina`, `Electricity` | Elektřina |
| *(prázdné nebo neznámé)* | Natural 95 (výchozí) |

**Příklad:**
```
Datum,Typ paliva,Tankováno litrů,Cena za litr,Celková cena,Stav tachometru,Km/tankování,Prům. spotřeba,Plná nádrž,Poznámka
4.7.2022,Natural 95,"42,00","45,00","1 890,00",245 448,—,—,Ano,
8.11.2022,Natural 95,"44,00","47,00","2 068,00",247 127,1 679,"7,8",Ano,
```

---

## Analytika — výpočty

| Karta | Co se počítá |
|---|---|
| **Celkové výdaje** | Servis + palivo + nákup vozidla |
| **Nákup vozidla** | Záznamy s kategorií `Nákup vozidla` |
| **Cena za km** | (Servis + palivo) ÷ ujetých km — **bez nákupu vozidla** |
| **Průměrná spotřeba** | Celkem natankované litry ÷ ujetých km × 100 |
| **Průměr / měsíc** | Celkové výdaje ÷ počet měsíců s aktivitou |
| **Servis / měsíc** | Servisní náklady (bez paliva a nákupu) ÷ počet měsíců |
| **Palivo / měsíc** | Náklady na palivo ÷ počet měsíců s tankováním |

---

## Technické informace

- **Technologie:** čistý HTML/CSS/JavaScript, žádné frameworky
- **Úložiště:** `localStorage` — klíč `autoservis_v3`
- **Fonty:** Outfit + JetBrains Mono (Google Fonts)
- **Protokol:** funguje i přes `file://` (bez serveru)
- **Jazyky:** čeština / angličtina (přepínač v Nastavení)
