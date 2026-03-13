# MyCars — Evidence vozidel

**Verze:** 3.2  
**Autor:** kraah  
**Typ:** Jednoduchá offline webová aplikace (single HTML file)

---

## O aplikaci

MyCars je offline nástroj pro evidenci vozidel, servisních záznamů a tankování. Vše běží přímo v prohlížeči — žádný server, žádná registrace, žádná data nikam neodesílaná. Data jsou uložena v `localStorage` prohlížeče pod klíčem `mycars_v3`.

Aplikace je dostupná jako jediný soubor `MyCars.html`, který lze otevřít přímo v prohlížeči přes `file://`.

---

## Funkce

| Stránka | Popis |
|---|---|
| **Přehled** | Aktuální stav vozidla, upozornění na expirace dokladů, poslední tankování |
| **Záznamy** | Servisní záznamy s přehledem statistik — datum, km, kategorie, cena, poznámka |
| **Tankování** | Evidence paliva — litry, cena, typ paliva, plná nádrž, spotřeba |
| **Analytika** | Grafy výdajů dle kategorie a měsíce, statistické karty |
| **Připomínky** | Opakované události podle km nebo data |
| **Nastavení** | Export/Import JSON zálohy, CSV import, přepnutí jazyka, správa dat |

---

## Datový model

### Vozidlo
- Základní údaje: značka, model, rok, SPZ, VIN, typ paliva, barva
- Doklady: STK, Emise, POV, Havarijní pojištění — datum + počet dní pro varování
- Servis: interval oleje, poslední výměna (km), upozornění (km zbývá)

### Kategorie výdajů

| Kategorie | Příklady položek |
|---|---|
| **Nákup vozidla** | Pořizovací cena vozidla |
| **Administrativa** | Pojištění/POV, STK, Přepis, Evidenční kontrola, Poplatky, Pokuty |
| **Provozní náplně** | Olej, Kapalina do ostřikovačů, Chladící směs, Brzdová kapalina |
| **Servis a opravy** | Mechanické práce, Filtry, Brzdy, Nápravy, Výfuk, Motor, Rozvody, Diagnostika, Baterie, Světla/Žárovky |
| **Pneumatiky a kola** | Nákup pneu, Přezutí, Vyvážení, Disky, Geometrie |
| **Vybavení a vzhled** | Koberce, Roletka, Autokosmetika, Oprava laku, Interiér, Doplňky |

> ⚠️ **Poznámka:** Kategorie `Nákup vozidla` je v analytice vyčleněna do samostatné bubliny a nezapočítává se do ceny za km.

### Typy paliva

| Typ vozidla | Dostupné typy paliva |
|---|---|
| Benzín | Natural 95, Natural 95+, Natural 98, Natural 100 |
| Diesel | Diesel, Diesel Premium |
| LPG | LPG |
| Elektro | Elektřina |
| Hybrid / PHEV | Natural 95 + Elektřina |

---

## Stránky — přehled

### Záznamy
Nad tabulkou záznamů se zobrazuje 5 statistických karet:

| Karta | Co zobrazuje |
|---|---|
| **Celkem za záznamy** | Součet všech servisních výdajů bez paliva |
| **Počet záznamů** | Celkový počet položek v historii |
| **Nejvyšší výdaj** | Nejvyšší jednorázová platba + název položky |
| **Poslední záznam** | Datum a km posledního servisního záznamu |
| **Nejčastější kategorie** | Kategorie s nejvyšší celkovou utratou |

Záznamy lze filtrovat podle kategorie a fulltextově prohledávat (popis, kategorie, poznámka). Řazení kliknutím na záhlaví sloupce.

### Tankování
Tabulka tankování zobrazuje spotřebu počítanou **metodou plné nádrže** — stejnou metodou jako analytika, takže čísla jsou vždy konzistentní.

Indikace plné nádrže: modrá tečka = plná nádrž, šedá tečka = doplnění.

### Analytika
Statistické karty s tooltipem (hover) vysvětlujícím výpočet:

| Karta | Co se počítá |
|---|---|
| **Celkové výdaje** | Servis + palivo + nákup vozidla |
| **Nákup vozidla** | Záznamy kategorie `Nákup vozidla` (zobrazí se jen pokud existuje) |
| **Cena za km** | (Servis + palivo) ÷ ujetých km — bez nákupu vozidla |
| **Průměrná spotřeba** | Metoda plné nádrže — průměr spotřeb mezi plnými tankováními |
| **Průměr / měsíc** | Celkové výdaje ÷ počet měsíců s aktivitou |
| **Servis / měsíc** | Servisní náklady (bez paliva a nákupu) ÷ počet měsíců |
| **Palivo / měsíc** | Náklady na palivo ÷ počet měsíců s tankováním |

### Připomínky
Dva typy připomínek:
- **Interval km** — při přidání se automaticky předvyplní interval oleje, poslední výměna a varování z profilu vozidla. Pod polem tachometru se zobrazí aktuální stav km.
- **Datum** — jednorázové nebo opakující se termíny (STK, pojištění…)

Stavy: ✅ V pořádku · ⚠️ Brzy · 🔴 Prošlé

---

## Export a import

### JSON záloha
- **Export:** Nastavení → Exportovat zálohu → stáhne soubor `mycars_YYYY-MM-DD-HHMMSS.json`
- **Import:** Nastavení → Importovat zálohu → načte JSON soubor (**přepíše stávající data**)

### Správa dat

| Akce | Co smaže | Co zachová |
|---|---|---|
| **Smazat provozní data** | Záznamy servisu, tankování, připomínky | Vozidla a jejich nastavení |
| **Smazat vše** | Vše — vozidla, záznamy, tankování, připomínky | — |

---

## Formát CSV souborů

Import historických dat ze souborů CSV (např. export z Google Sheets).

### Servisní záznamy

**Kódování:** UTF-8 · **Oddělovač:** čárka (`,`)

| Sloupec | Povinný | Formát | Poznámka |
|---|---|---|---|
| `Datum` | doporučený | `DD.MM.RRRR` | Prázdné datum → řádek importován s varováním |
| `Stav tachometru` | ne | číslo (může mít `\xa0` jako oddělovač tisíců) | |
| `Popis` | ano | text | |
| `Součástky` | ne | číslo | Počet kusů (výchozí: 1) |
| `Jednotková cena` | ne | číslo s čárkou jako des. oddělovačem, může obsahovat `Kč` a `\xa0` | |
| `Celková cena` | ano | číslo s čárkou jako des. oddělovačem, může obsahovat `Kč` a `\xa0` | |
| `Kategorie` | ne | text | Automaticky mapováno na nové kategorie (viz tabulka níže) |

#### Mapování kategorií při importu

Aplikace automaticky zařadí staré i neznámé kategorie do nového systému:

| Klíčová slova v názvu kategorie | Nová kategorie |
|---|---|
| nákup, vehicle purchase | Nákup vozidla |
| pojištění, insurance, pov, stk, mot, poplatky, fees, přepis, pokuta | Administrativa |
| olej, oil, chladič, coolant, ostřikovač, washer, brzdová kapalina, náplň | Provozní náplně |
| pneumatik, tyre, tire, kolo, wheel, disk, přezutí, vyvážení, geometrie | Pneumatiky a kola |
| vybavení, equipment, koberec, roletka, autokosmetika, lak, interiér, karoserie | Vybavení a vzhled |
| *(vše ostatní)* | Servis a opravy |

**Příklad:**
```
Datum,Stav tachometru,Popis,Součástky,Jednotková cena,Celková cena,Kategorie
5.9.2022,245 448,Výměna oleje Castrol,7,"231,43","1 620,01",Olej
5.9.2022,245 448,Olejový filtr MANN,1,"315,00","315,00",Filtry
5.9.2022,245 448,STK,1,"3 500,00","3 500,00",STK
```

---

### Tankování

**Kódování:** UTF-8 · **Oddělovač:** čárka (`,`)

| Sloupec | Povinný | Formát | Poznámka |
|---|---|---|---|
| `Datum` | doporučený | `DD.MM.RRRR` | |
| `Typ paliva` | ne | text | viz tabulka mapování níže |
| `Tankováno litrů` | ano | číslo s čárkou | |
| `Cena za litr` | ne | číslo s čárkou, může obsahovat `Kč` a `\xa0` | |
| `Celková cena` | ano | číslo s čárkou, může obsahovat `Kč` a `\xa0` | |
| `Stav tachometru` | ne | číslo, může mít `\xa0` jako oddělovač tisíců | |
| `Km/tankování` | ne | ignorováno | |
| `Prům. spotřeba` | ne | ignorováno; `Nelze spočítat` akceptováno | |
| `Plná nádrž` | ne | `Ano` / `Ne` | |
| `Poznámka` | ne | text | |

#### Mapování typů paliva

| Hodnota v CSV | Interní typ |
|---|---|
| `Natural 95`, `E10`, `95` | Natural 95 |
| `Natural 95+`, `95+` | Natural 95+ |
| `Natural 98`, `98` | Natural 98 |
| `Natural 100`, `100` | Natural 100 |
| `Diesel` | Diesel |
| `Diesel Premium` | Diesel Premium |
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

## Technické informace

- **Technologie:** čistý HTML/CSS/JavaScript, žádné frameworky
- **Úložiště:** `localStorage` — klíč `mycars_v3`
- **Fonty:** Outfit + JetBrains Mono (Google Fonts)
- **Protokol:** funguje i přes `file://` (bez serveru)
- **Jazyky:** čeština / angličtina (přepínač v Nastavení)
- **Výpočet spotřeby:** metoda plné nádrže — konzistentní napříč Tankováním i Analytikou
