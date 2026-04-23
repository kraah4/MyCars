# MyCars — Vehicle Maintenance Tracker

**Version:** 3.10.1 · **Build:** 20260423-001  
**Author:** kraah  
**Type:** Single-file offline web application

---

## Overview

MyCars is a privacy-first, offline vehicle maintenance and expense tracker. Everything runs directly in the browser — no server, no account, no data ever leaves your device. Data is stored in browser `localStorage` under the key `mycars_v3`.

The entire application is a single `MyCars.html` file that works over `file://` as well as any HTTP server.

---

## Quick Start

1. Open `MyCars.html` in any modern browser (Chrome, Firefox, Safari, Edge, Vivaldi)
2. Click **Add vehicle** in the left sidebar
3. Fill in make, model, and fuel type — all other fields are optional
4. Start adding service records (**New record**) and fuel entries (**New fuel entry**)

The app supports both **Czech** and **English** — switch via Settings → Interface language.

---

## Pages

| Page | Description |
|---|---|
| **Dashboard** | Vehicle status, document expiry alerts, last refuel, key statistics |
| **Records** | Service records with 5 summary stat cards, full-text search, category filter |
| **Fuel log** | Fuel entries with per-tank consumption, average price/litre |
| **Analytics** | Expense charts, monthly trends, and categorized stats (Costs, Service, Fuel) |
| **Reminders** | Km-based and date-based reminders with status indicators |
| **Settings** | Language, JSON backup, CSV import, data management, app info |

---

## Vehicle Profile Fields

| Field | Required | Notes |
|---|---|---|
| Make | yes | e.g. Škoda, VW, Audi |
| Model | yes | e.g. Octavia, Golf |
| Year | no | Manufacturing year |
| Plate | no | Displayed in sidebar |
| VIN | no | |
| Fuel type | yes | Petrol / Diesel / LPG / Electric / Hybrid / PHEV |
| Status | yes | Active / Inactive — inactive vehicles sorted to the bottom of sidebar |
| Starting odometer | no | Baseline km for driven distance calculations |
| Acquisition date | no | Date the vehicle was purchased |
| Decommission date | no | Date the vehicle was retired |
| Colour | no | Visual identifier dot in the sidebar |
| Tyres | no | Summer / winter / all-season sets, each with **front and rear axle** parameters: width, aspect ratio, rim diameter, load index, speed index, tyre pressure (low/high load). A "Front = rear" toggle hides the rear fields when both axles share the same specification. |
| Documents | no | STK, Emissions, Liability insurance, Comprehensive insurance — each with expiry date + warning threshold (days) |
| Oil service | no | Interval (km), last done at (km), warning threshold (km remaining) |
| Notes | no | Free text |

---

## Expense Categories

The application uses a fixed set of categories to organize expenses. Each category has a corresponding Czech name used in the interface when the language is set to Czech.

| Category | Typical items |
|---|---|
| **Vehicle purchase**<br>*(Nákup vozidla)* | Acquisition cost — excluded from cost/km and monthly chart |
| **Administration**<br>*(Administrativa)* | Insurance (liability/comprehensive), MOT/STK, registration transfer, fees, fines |
| **Fluids & consumables**<br>*(Provozní náplně)* | Engine oil, washer fluid, coolant, brake fluid, AdBlue |
| **Service & repairs**<br>*(Servis a opravy)* | All mechanical repairs, filters, brakes, engine parts, timing belt, diagnostics, labour |
| **Tyres & wheels**<br>*(Pneumatiky a kola)* | Tyre purchase, fitting, balancing, rims, seasonal change, alignment |
| **Equipment & appearance**<br>*(Vybavení a vzhled)* | Car cosmetics, cleaning, floor mats, accessories, paint repair, interior |

> **Vehicle purchase** is intentionally isolated from all cost-per-km and monthly trend calculations so it does not distort running-cost analysis.

---

## Fuel Types

| Vehicle type | Available fuel types |
|---|---|
| Petrol | Natural 95, Natural 95+, Natural 98, Natural 100 |
| Diesel | Diesel, Diesel Premium |
| LPG | LPG |
| Electric | Electric (kWh) |
| Hybrid / PHEV | Natural 95 + Electric |

---

## How Calculations Work

All calculations are centralised in shared helper functions so every page (Dashboard, Fuel log, Analytics) always shows identical numbers.

### Average fuel consumption — full-tank method

The app uses the **full-tank method** rather than a simple total-litres ÷ total-km ratio.

**Algorithm:**
1. Filter fuel entries where `fullTank = true`, sorted by odometer.
2. For each consecutive pair of full-tank entries `[A, B]`:
   - `kmDiff = B.odo − A.odo`
   - `liters = sum of all fuel entries with odo > A.odo AND odo ≤ B.odo`
   - `consumption = liters / kmDiff × 100` (l/100 km)
3. Average consumption = arithmetic mean of all valid segments.

This correctly handles partial top-ups between full fills.

### Cost per km

```
costPerKm = (serviceCost + fuelCost) ÷ kmDriven
```

- `serviceCost` excludes the **Vehicle purchase** category
- `kmDriven = maxOdometer − startingOdometer`
- Vehicle purchase is shown as a separate stat card and never included in running-cost metrics

### Fuel-only cost per km

```
fuelCostPerKm = totalFuelCost ÷ kmDriven
```

### Average price per litre

```
avgPricePerLitre = totalFuelCost ÷ totalLitres
```

### Monthly averages

`monthCount` = number of calendar months that contain at least one record or fuel entry.

```
avgPerMonth      = totalCost ÷ monthCount         (incl. vehicle purchase)
servicePerMonth  = serviceCost ÷ monthCount
fuelPerMonth     = fuelCost ÷ monthCount
avgKmPerYear     = kmDriven ÷ (monthCount ÷ 12)
```

### Monthly chart (Analytics)

- Y-axis scales to the highest **service + fuel** month (vehicle purchase excluded)
- Red bars = service expenses · Blue bars = fuel expenses
- Dashed line = monthly average (service + fuel)
- "Service+fuel (12m)" total in the chart header = rolling 12-month sum, no vehicle purchase
- Hover (desktop) or tap (mobile) a bar to see the monthly breakdown including top 3 service items

---

## Reminders

Two reminder types:

**Km-based** (e.g. oil change every 10 000 km)
- Fields: name, interval (km), last done at (km), warn when X km remaining
- When creating a km reminder, the app pre-fills interval and last-done from the vehicle oil service profile

**Date-based** (e.g. MOT expiry)
- Fields: name, date

**Automatic (Seasonal)**
- The app can automatically remind you to change tyres (Summer/Winter)
- Enabled in **Settings** → **Tyre change reminders**
- Alerts 30 days before **Nov 1** (Winter side) and **Mar 31** (Summer side) for all active vehicles

Status: `OK` · `Due soon` (within warning threshold) · `Overdue`

---

## Sidebar Vehicle Order

Active vehicles first (alphabetical A→Z), then inactive vehicles (alphabetical A→Z).

---

## Data Backup

### JSON export / import

- **Export:** Settings → Export backup → downloads `mycars_YYYY-MM-DD-HHMMSS.json`
- **Import:** Settings → Import backup → replaces all existing data

> ⚠️ Import is destructive — it overwrites everything. Always export a backup first.

### Data management options

| Action | Deletes | Keeps |
|---|---|---|
| Delete operational data | All records, fuel entries, reminders | Vehicles and their profiles |
| Delete everything | All data | — |

---

## CSV Import

Import historical data exported from spreadsheets (e.g. Google Sheets).

### Service records CSV

**Encoding:** UTF-8 · **Delimiter:** comma (`,`)

| Column | Required | Format | Notes |
|---|---|---|---|
| `Datum` | recommended | `DD.MM.YYYY` | Empty date → row imported with warning flag |
| `Stav tachometru` | no | number, `\xa0` thousands separator accepted | |
| `Popis` | **yes** | text | Description / item name |
| `Součástky` | no | number | Quantity, default 1 |
| `Jednotková cena` | no | decimal with comma, may contain `Kč` / `\xa0` | Unit price |
| `Celková cena` | **yes** | decimal with comma | Total price |
| `Kategorie` | no | text | Auto-mapped to current categories (see below) |

**Automatic category mapping**

Old or unknown category names are mapped at import time:

| Keywords in category name | Target category |
|---|---|
| nákup, vehicle purchase | Vehicle purchase |
| pojištění, insurance, pov, stk, mot, poplatky, fees, přepis, pokuta | Administration |
| olej, oil, chladič, coolant, ostřikovač, washer, brzdová kapalina | Fluids & consumables |
| pneumatik, tyre, tire, kol, wheel, disk, přezutí, vyvážení, geometrie | Tyres & wheels |
| vybavení, equipment, koberec, roletka, autokosmetika, lak, interiér, karoserie | Equipment & appearance |
| *(anything else)* | Service & repairs |

**Example:**
```csv
Datum,Stav tachometru,Popis,Součástky,Jednotková cena,Celková cena,Kategorie
5.9.2022,245 448,Oil change Castrol,7,"231,43","1 620,01",Olej
5.9.2022,245 448,Oil filter MANN,1,"315,00","315,00",Filtry
5.9.2022,245 448,MOT,1,"3 500,00","3 500,00",STK
```

---

### Fuel entries CSV

**Encoding:** UTF-8 · **Delimiter:** comma (`,`)

| Column | Required | Format | Notes |
|---|---|---|---|
| `Datum` | recommended | `DD.MM.YYYY` | |
| `Typ paliva` | no | text | See mapping below |
| `Tankováno litrů` | **yes** | decimal with comma | |
| `Cena za litr` | no | decimal with comma, `Kč`/`\xa0` accepted | |
| `Celková cena` | **yes** | decimal with comma | |
| `Stav tachometru` | no | number, `\xa0` thousands separator accepted | |
| `Km/tankování` | no | ignored | |
| `Prům. spotřeba` | no | ignored; `Nelze spočítat` accepted | |
| `Plná nádrž` | no | `Ano` / `Ne` | Whether tank was completely filled |
| `Poznámka` | no | text | |

**Fuel type mapping**

| CSV value | Internal type |
|---|---|
| `Natural 95`, `E10`, `95` | Natural 95 |
| `Natural 95+`, `95+` | Natural 95+ |
| `Natural 98`, `98` | Natural 98 |
| `Natural 100`, `100` | Natural 100 |
| `Diesel` | Diesel |
| `Diesel Premium` | Diesel Premium |
| `LPG` | LPG |
| `Elektřina`, `Electricity` | Electric |
| *(unknown or empty)* | Natural 95 (default) |

> **Important for consumption accuracy:** Mark entries as full tank (`Plná nádrž: Ano`) wherever possible. The app's full-tank method only creates consumption segments between full fills — entries without this flag are included in litre totals but do not anchor new segments.

**Example:**
```csv
Datum,Typ paliva,Tankováno litrů,Cena za litr,Celková cena,Stav tachometru,Km/tankování,Prům. spotřeba,Plná nádrž,Poznámka
4.7.2022,Natural 95,"42,00","45,00","1 890,00",245 448,—,—,Ano,
8.11.2022,Natural 95,"44,00","47,00","2 068,00",247 127,1 679,"7,8",Ano,
12.12.2022,Natural 95,"10,00","48,50","485,00",247 220,—,—,Ne,Top-up
```

---

## Analytics — All Stat Cards

| Card | Formula | Notes |
|---|---|---|
| Total expenses | service + fuel + vehicle purchase | All-time |
| Vehicle purchase | Records in "Vehicle purchase" category | Hidden if zero |
| Cost per km | (service + fuel) ÷ km driven | Excludes purchase |
| Fuel cost per km | fuel cost ÷ km driven | |
| Avg consumption | Full-tank method | l/100 km |
| Avg / month | total ÷ active months | Incl. purchase |
| Service / month | service ÷ active months | |
| Fuel / month | fuel ÷ active months | |
| Total driven | maxOdometer − startingOdometer | km |
| Avg km / year | km driven ÷ (active months ÷ 12) | |

---

## Technical Details

| | |
|---|---|
| **Stack** | Plain HTML + CSS + JavaScript, zero dependencies |
| **Storage** | `localStorage` — key `mycars_v3` |
| **Fonts** | Outfit + JetBrains Mono (Google Fonts CDN) |
| **Protocol** | Works over `file://` and HTTP |
| **Languages** | Czech / English |
| **Mobile** | Responsive — sidebar becomes slide-in drawer on screens ≤ 768px |
| **Touch targets** | Minimum 44 × 44 px on all interactive elements |
| **WCAG** | Text contrast ratios ≥ 4.5:1 |
| **Codebase** | ~2 500 lines, single file |

### localStorage data structure

```json
{
  "cars": [
    {
      "id": "uid",
      "make": "Škoda", "model": "Octavia", "year": 2008,
      "plate": "1Z3 4567", "vin": "...", "fuelType": "petrol",
      "status": "active", "startOdo": 243927, "color": "#e8c547",
      "stk": "2026-09-05", "stkWarn": 30,
      "emission": null, "emissionWarn": 30,
      "pov": "2026-03-14", "povWarn": 30,
      "insurance": null, "insuranceWarn": 30,
      "oilInterval": 10000, "oilLastKm": 270000, "oilWarn": 1000,
      "acquired": "2022-03-11", "decommissioned": null,
      "note": ""
    }
  ],
  "records": [
    {
      "id": "uid", "carId": "...", "date": "2022-09-05",
      "odo": 245448, "desc": "Oil change", "cat": "Provozní náplně",
      "qty": 7, "price": 231.43, "note": "",
      "createdAt": "...", "updatedAt": "..."
    }
  ],
  "fuels": [
    {
      "id": "uid", "carId": "...", "date": "2022-11-08",
      "odo": 247127, "fuelTypeId": "p95", "liters": 44,
      "cost": 2068, "fullTank": true, "note": "",
      "createdAt": "..."
    }
  ],
  "reminders": [
    {
      "id": "uid", "carId": "...", "name": "Oil change",
      "type": "km", "interval": 10000, "lastDone": 270000, "warnAt": 1000
    }
  ],
  "savedAt": "2026-03-16T12:00:00.000Z"
}
```

> Data persists in the browser profile. Clearing browser data or using private/incognito mode will erase it. Use **Settings → Export backup** regularly.

#### Tyre set structure (summer / winter / allseason)

```json
{
  "same": true,
  "front": { "width": 235, "aspect": 45, "rim": 17, "load": 97, "speed": "Y", "plow": 2.2, "phigh": 2.5 },
  "rear": null
}
```

`same: true` → rear axle is identical to front (rear field is null, only front is stored).  
`same: false` → rear object contains its own independent parameters.  
**Legacy format** (parameters directly on set root, pre-3.10.1) is automatically detected and treated as `same: true`.
