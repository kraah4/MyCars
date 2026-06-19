# MyCars — Vehicle Maintenance Tracker

**Version:** 3.16.0 · **Build:** 20260618-017
**Author:** kraah  
**License:** GNU GPL v3 (with §7 attribution requirement — see `LICENSE`)  
**Live:** https://kraah4.github.io/MyCars/MyCars.html  
**Type:** Offline web application (PWA) — `MyCars.html` + `mycars.js` + `mycars-sw.js`

---

## Overview

MyCars is a privacy-first, offline vehicle maintenance and expense tracker. Everything runs directly in the browser — no server, no account, no data ever leaves your device. Data is stored in browser `localStorage` under the key `mycars_v3`.

The app entry point is `MyCars.html` (markup + styles) with all logic in `mycars.js` and an optional Service Worker (`mycars-sw.js`) for offline cache. It works over `file://` as well as any HTTP server.

---

## Quick Start

### Online (GitHub Pages)

Open **https://kraah4.github.io/MyCars/MyCars.html** in any browser.

**iPhone / iPad:** Safari → Share → *Add to Home Screen* — installs as a standalone PWA with offline support and a home screen icon.

**Android / Chrome:** Browser menu → *Install app* or *Add to Home Screen*.

### Local

1. Open `MyCars.html` in any modern browser (Chrome, Firefox, Safari, Edge, Vivaldi)
2. Click **Add vehicle** in the left sidebar
3. Fill in make, model, and fuel type — all other fields are optional
4. Start adding service records (**New record**) and fuel entries (**New fuel entry**)

> **Note:** Service Worker (offline cache) only activates over HTTP/HTTPS. When opening the file directly via `file://`, the app works fully but without offline caching.

The app supports both **Czech** and **English** — switch via Settings → Interface language.

---

## Pages

| Page | Description |
| --- | --- |
| **Fleet** | Vehicle cards split into **Active vehicles** and a collapsible **Archive** section (sold / decommissioned cars). Cards show document pills, current service/job badges and — for vehicles *For sale* — the asking price and listing link |
| **Dashboard** | Vehicle status, document expiry alerts, last refuel, key statistics including km driven in the current calendar year |
| **Records** | Service records with 5 summary stat cards, full-text search, category filter |
| **Diary** | Unified chronological timeline of every event across all vehicles — service records, fuel entries, job lifecycle (created / done / cancelled) and vehicle lifecycle (acquired / decommissioned / sold). Grouped by month with sticky headers, full-text search, and multi-select category chips. See the *Diary* section below |
| **Fuel log** | Fuel entries with per-tank consumption, average price/litre |
| **Analytics** | Expense charts, monthly trends, and categorized stats (Costs, Service, Fuel). **Comparison tab** ranks all vehicles by avg. consumption, cost/km, avg. monthly cost, avg. service cost, total cost, and mileage; includes a full detail comparison table |
| **Reminders** | Km-based and date-based reminders with status indicators; suspended vehicles (storage / in restoration) are folded into their own collapsible section, decommissioned ones are hidden |
| **Service** | Planned-service work orders (jobs) — see the *Service & planned jobs* section below |
| **Settings** | Appearance (theme), language, tyre reminders, JSON backup, CSV import, data management, app info |

---

## Vehicle Profile Fields

| Field | Required | Notes |
| --- | --- | --- |
| Make | yes | e.g. Škoda, VW, Audi |
| Model | yes | e.g. Octavia, Golf |
| Year | no | Manufacturing year |
| Plate | no | Displayed in sidebar |
| VIN | no | |
| Fuel type | yes | Petrol / Diesel / LPG / Electric / Hybrid / PHEV |
| Status | yes | One of 6 values — see *Vehicle status* below |
| Classification | no | Standard / Youngtimer / Historic / Veteran — see *Vehicle classification* below |
| Asking price | conditional | Only shown for *For sale* — displayed as a pill on the fleet card |
| Listing URL | conditional | Only shown for *For sale* — clickable “Listing ↗” pill on the fleet card |
| Starting odometer | no | Baseline km for driven distance calculations |
| Acquisition date | no | Date the vehicle was purchased |
| Decommission date | no | Date the vehicle was retired (auto-filled to today when archived if missing) |
| Colour | no | Visual identifier dot in the sidebar |
| Tyres | no | Summer / winter / all-season sets, each with **front and rear axle** parameters: width, aspect ratio, rim diameter, load index, speed index, tyre pressure (low/high load). A “Front = rear” toggle hides the rear fields when both axles share the same specification. Each set also has an optional **manufacture date** field (free text, e.g. `2023` or DOT week/year code `2350`). |
| Documents | no | STK, Emissions, Liability insurance, Comprehensive insurance — each with expiry date + warning threshold (days) |
| Oil service | no | Interval (km), last done at (km), warning threshold (km remaining) |
| Notes | no | Free text |

### Vehicle status (6 values)

The status drives where the vehicle appears in the Fleet view (active vs. archive), whether it shows up in the Service / Reminders pages, and whether sale-only fields are exposed.

| Status | Group | Meaning |
| --- | --- | --- |
| **Operational** | active | Daily driver — full participation in Fleet, Reminders, Service |
| **In storage** | active (suspended) | Temporarily off the road — folded under *Suspended* in Reminders |
| **In restoration** | active (suspended) | Being restored — same handling as *In storage* |
| **For sale** | active | Adds the *Asking price* and *Listing URL* fields, shown as pills on the fleet card |
| **Sold** | archive | Hidden from active fleet — appears in the collapsible *Archive* section |
| **Decommissioned** | archive | Same archive handling — also used for totalled / scrapped cars |

Legacy backups (`status: "active"` / `status: "inactive"`) are migrated automatically on load and on import: `active → operational`, `inactive → in storage`.

### Vehicle classification (4 values)

A secondary tag that influences a few specific behaviours (e.g. historic cars skip the automatic seasonal tyre reminder and use the 2-year MOT/STK interval).

| Classification | Notes |
| --- | --- |
| **Standard** | Default |
| **Youngtimer** | Informational pill on Fleet / Dashboard |
| **Historic (HV)** | Hint shown in Reminders: *“STK ve 2-letém intervalu, POV není povinné.”* — also skipped by the seasonal tyre reminder |
| **Veteran** | Same MOT exemptions as Historic; usually paired with status *In restoration* or *In storage* |

---

## Expense Categories

The application uses a fixed set of 6 categories to organise expenses.

| Category | Typical items |
| --- | --- |
| **Vehicle purchase** | Acquisition cost — excluded from cost/km and monthly chart |
| **Administration** | Insurance (liability/comprehensive), MOT/STK, registration transfer, fees, fines |
| **Fluids & consumables** | Engine oil, washer fluid, coolant, brake fluid, AdBlue |
| **Service & repairs** | All mechanical repairs, filters, brakes, engine parts, timing belt, diagnostics, labour |
| **Tyres & wheels** | Tyre purchase, fitting, balancing, rims, seasonal change, alignment |
| **Equipment & appearance** | Car cosmetics, cleaning, floor mats, accessories, paint repair, interior |

> **Vehicle purchase** is intentionally isolated from all cost-per-km and monthly trend calculations so it does not distort running-cost analysis.

---

## Fuel Types

| Vehicle type | Available fuel types |
| --- | --- |
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

#### Algorithm

1. Filter fuel entries where `fullTank = true` **and** `odo > 0`, sorted by odometer.
2. For each consecutive pair of full-tank entries `[A, B]` where `B.odo − A.odo ≥ 5 km`:
   - `kmDiff = B.odo − A.odo`
   - `liters = sum of all fuel entries with odo > A.odo AND odo ≤ B.odo`
   - `consumption = liters / kmDiff × 100` (l/100 km)
   - Segments with consumption **> 40 l/100 km** are discarded as data errors
3. Average consumption = **weighted average**: `totalLitres / totalKm × 100` (between first and last full fill)
   — robust against outlier short segments that would skew an arithmetic mean.

### Cost per km

```text
costPerKm = (serviceCost + fuelCost) ÷ kmDriven
```

- `serviceCost` excludes the **Vehicle purchase** category
- `kmDriven = maxOdometer − startingOdometer`
- Vehicle purchase is shown as a separate stat card and never included in running-cost metrics

### Fuel-only cost per km

```text
fuelCostPerKm = totalFuelCost ÷ kmDriven
```

### Average price per litre

```text
avgPricePerLitre = totalFuelCost ÷ totalLitres
```

### Monthly averages

`monthCount` = number of calendar months that contain at least one record or fuel entry.

```text
avgPerMonth      = totalCost ÷ monthCount         (incl. vehicle purchase)
servicePerMonth  = serviceCost ÷ monthCount
fuelPerMonth     = fuelCost ÷ monthCount
avgKmPerYear     = kmDriven ÷ (monthCount ÷ 12)
```

### Km driven in current calendar year

```text
kmThisYear = maxOdo(current year) − maxOdo(before Jan 1 of current year)
```

- Takes the highest odometer reading from all records and fuel entries dated within the current year
- Subtracts the highest odometer reading from before January 1 of the current year as the baseline (falls back to the vehicle’s starting odometer if no earlier readings exist)
- Displayed on the **Dashboard** stat cards and in the **Analytics → Overview → Vehicles** section; for multi-vehicle selections the values are summed

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

### Automatic (Seasonal)

- The app can automatically remind you to change tyres (Summer/Winter)
- Enabled in **Settings** → **Tyre change reminders**
- Alerts 30 days before **Nov 1** (Winter side) and **Mar 31** (Summer side) for all active vehicles
- Vehicles classified as **Historic** or **Veteran** are skipped (a small hint is shown on the page)

Status: `OK` · `Due soon` (within warning threshold) · `Overdue`

The Reminders page is split into two sections:

- **Active** — operational + for_sale vehicles
- **Suspended** (collapsible, expanded by default) — vehicles in storage or in restoration

Sold / decommissioned vehicles are not listed at all.

---

## Service & Planned Jobs

The **Service** page tracks planned-service work orders ("jobs"). Each job represents a visit to a workshop and has:

| Field | Notes |
| --- | --- |
| Vehicle | Picker excludes archived vehicles (sold / decommissioned) for new jobs |
| Workshop | Free text with autocomplete from previously used workshops |
| Start / end date | Date pickers |
| Status | `planned` · `in_progress` · `done` · `cancelled` |
| Estimated cost | Used as the price when the job is converted to a service record |
| Tasks | Checklist — items can be ticked off directly from the fleet card |
| Notes | Free text |

The page groups jobs into four sections: *Currently in service*, *Planned*, *Done* (collapsed) and *Cancelled* (collapsed). Active and upcoming jobs are surfaced on the matching fleet card as a 🔧 or 📅 pill (hover/tap to see the workshop + dates). Marking a job **Done → record** opens a pre-filled record modal (category *Service & repairs*, description = workshop + ticked tasks, price = estimated cost) and flips the job status to `done`.

---

## Diary

The **Diary** page aggregates everything that ever happened to your fleet into a single chronological feed. Four event sources are merged:

| Source | Event types |
| --- | --- |
| `records` | Every service / cost record (coloured by category) |
| `fuels` | Every refuel (litres, price, full-tank flag) |
| `jobs` | Job created · done · cancelled |
| `lifecycle` | Vehicle acquired · decommissioned · sold |

### Scope & filters

- **Vehicle scope** — *(none selected)* shows all active vehicles, the switcher's *All vehicles* option includes the archive, and picking a single car narrows the timeline to that one
- **Search** — full-text over title, subtitle, note, workshop and category
- **Category chips** — clickable, multi-select, coloured per category. Empty selection = everything visible; selecting one or more chips narrows to *records* of those categories only (fuel / jobs / lifecycle hide when any chip is active). An ✕ chip clears the selection. Categories with zero records in the current scope are hidden automatically.
- **Mobile** — chips collapse into a single horizontally scrollable row with a soft fade on the edges; the event counter is hidden (per-month counts are visible in the sticky headers)

### Layout

Events are grouped by month with sticky `Month YYYY` headers. Each item shows a coloured bullet (category colour for records, blue for fuel, purple/green/grey for job transitions, green/orange/red for lifecycle), date, vehicle (colour dot + name + plate), title, optional category badge / subtitle, odometer, cost and note.

> Diary is a **derived view** — there is nothing new in the JSON schema, the page simply rebuilds the timeline from `records`, `fuels`, `jobs` and per-car `acquired` / `decommissioned` fields.

---

## Sample / Showcase Data

A ready-to-import demo dataset lives in [`mycars_showcase_data.json`](mycars_showcase_data.json). It covers all 6 vehicle statuses and all 4 classifications:

- **Operational:** Audi A4 Avant, BMW 530d xDrive (daily drivers)
- **For sale:** Honda Civic Type R (with asking price + listing URL)
- **In restoration:** Škoda 1000 MB (1967, veterán) — mid-restoration
- **Archive (sold):** Lexus IS 250, Audi Q7, Alfa Giulia, VW Transporter, Škoda 110 R Coupé
- **Archive (decommissioned):** BMW 320i (totalled after rear-end collision)

It also includes four sample **jobs** spanning *planned*, *in_progress* and *done* statuses, plus the matching reminders.

To try it: **Settings → Import backup → select `mycars_showcase_data.json`**.

> ⚠️ Import is destructive — it overwrites your current data. Export a backup first if needed.

---

## Sidebar / Switcher Vehicle Order

Vehicle switcher (top-bar dropdown) and the *Active* section of the Fleet page list vehicles alphabetically (A→Z). Archived vehicles (sold / decommissioned) only appear in the collapsible **Archive** section of the Fleet page and are excluded from the switcher's main list.

---

## Data Backup

### JSON export / import

- **Export:** Settings → Export backup → downloads `mycars_YYYY-MM-DD-HHMMSS.json`. Exports the full state — vehicles, records, fuel entries, reminders, jobs **plus** `settings` (theme, tyre reminders) and `lang`. The file carries `app: "MyCars"`, `version`, and a numeric `schema` field for forward-compatibility detection.
- **Import:** Settings → Import backup → replaces all existing data. The import summary toast shows counts of restored vehicles (incl. archive), records, fuel entries, reminders and jobs. If the backup's `schema` is newer than this build, the app shows a confirmation prompt warning that some fields may be lost — cancel to abort cleanly without touching existing data.

> ⚠️ Import is destructive — it overwrites everything. Always export a backup first.

### Data management options

| Action | Deletes | Keeps |
| --- | --- | --- |
| Delete operational data | All records, fuel entries, reminders | Vehicles and their profiles |
| Delete everything | All data | — |

---

## CSV Import

Import historical data exported from spreadsheets (e.g. Google Sheets).

> **Overwrite mode:** importing a CSV file **replaces all existing records of that type** for the selected vehicle. The preview screen shows how many existing records will be deleted before you confirm. Always export a JSON backup first if you want to keep the original data.

### Import modal

- **Vehicle** — searchable filter input above the dropdown (type any part of make, model or plate)
- **Import type** — must be explicitly selected (starts with a blank placeholder) to prevent accidental wrong-type imports

### Service records CSV

**Encoding:** UTF-8 · **Delimiter:** comma (`,`)

> **Note:** Column headers must be in Czech (as listed below) — the importer detects columns by their Czech names.

| Column | Required | Format | Notes |
| --- | --- | --- | --- |
| `Datum` *(Date)* | recommended | `DD.MM.YYYY` | Empty date → row imported with warning flag |
| `Stav tachometru` *(Odometer)* | no | number, `\xa0` thousands separator accepted | |
| `Popis` *(Description)* | **yes** | text | Item name / description |
| `Součástky` *(Quantity)* | no | number | Default 1 |
| `Jednotková cena` *(Unit price)* | no | decimal with comma, may contain `Kč` / `\xa0` | |
| `Celková cena` *(Total price)* | **yes** | decimal with comma | |
| `Kategorie` *(Category)* | no | text | Auto-mapped to current categories (see below) |

#### Automatic category mapping

Category names are matched by keyword at import time. The matcher recognises both Czech and English keywords:

| Keywords in category column | Target category |
| --- | --- |
| nákup, vehicle purchase | Vehicle purchase |
| pojištění, insurance, pov, stk, mot, poplatky, fees, přepis, pokuta | Administration |
| olej, oil, chladič, coolant, ostřikovač, washer, brzdová kapalina | Fluids & consumables |
| pneumatik, tyre, tire, kol, wheel, disk, přezutí, vyvážení, geometrie | Tyres & wheels |
| vybavení, equipment, koberec, roletka, autokosmetika, lak, interiér, karoserie | Equipment & appearance |
| *(anything else)* | Service & repairs |

#### Example

```csv
Datum,Stav tachometru,Popis,Součástky,Jednotková cena,Celková cena,Kategorie
5.9.2022,245 448,Oil change Castrol,7,"231,43","1 620,01",oil
5.9.2022,245 448,Oil filter MANN,1,"315,00","315,00",
5.9.2022,245 448,MOT,1,"3 500,00","3 500,00",mot
```

---

### Fuel entries CSV

**Encoding:** UTF-8 · **Delimiter:** comma (`,`)

> **Note:** Column headers must be in Czech (as listed below) — the importer detects columns by their Czech names.

| Column | Required | Format | Notes |
| --- | --- | --- | --- |
| `Datum` *(Date)* | recommended | `DD.MM.YYYY` | |
| `Typ paliva` *(Fuel type)* | no | text | See mapping below |
| `Tankovanó litrů` *(Litres fuelled)* | **yes** | decimal with comma | |
| `Cena za litr` *(Price per litre)* | no | decimal with comma, `Kč`/`\xa0` accepted | |
| `Celková cena` *(Total cost)* | **yes** | decimal with comma | |
| `Stav tachometru` *(Odometer)* | no | number, `\xa0` thousands separator accepted | |
| `Km/tankovaní` *(Km per fill)* | no | ignored | |
| `Prům. spotřeba` *(Avg consumption)* | no | ignored; `Nelze spočítat` (Cannot calculate) accepted | |
| `Plná nádrž` *(Full tank)* | no | `Ano` / `Ne` (Yes / No) | Whether tank was completely filled |
| `Poznámka` *(Note)* | no | text | |

#### Fuel type mapping

| CSV value | Internal type |
| --- | --- |
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

#### Example (fuel entries)

```csv
Datum,Typ paliva,Tankováno litrů,Cena za litr,Celková cena,Stav tachometru,Km/tankování,Prům. spotřeba,Plná nádrž,Poznámka
4.7.2022,Natural 95,"42,00","45,00","1 890,00",245 448,—,—,Ano,
8.11.2022,Natural 95,"44,00","47,00","2 068,00",247 127,1 679,"7,8",Ano,
12.12.2022,Natural 95,"10,00","48,50","485,00",247 220,—,—,Ne,Top-up
```

---

## Analytics — All Stat Cards

| Card | Formula | Notes |
| --- | --- | --- |
| Total expenses | service + fuel + vehicle purchase | All-time |
| Vehicle purchase | Records in "Vehicle purchase" category | Hidden if zero |
| Cost per km | (service + fuel) ÷ km driven | Excludes purchase |
| Fuel cost per km | fuel cost ÷ km driven | |
| Avg consumption | Full-tank method | l/100 km |
| Avg / month | total ÷ active months | Incl. purchase |
| Service / month | service ÷ active months | |
| Fuel / month | fuel ÷ active months | |
| Total driven | maxOdometer − startingOdometer | km |
| km this year | Max odo in current year − last odo before Jan 1 | Dashboard + Analytics |
| Avg km / year | km driven ÷ (active months ÷ 12) | |

---

## Technical Details

| Property | Value |
| --- | --- |
| **Stack** | Plain HTML + CSS + JavaScript, zero dependencies |
| **Storage** | `localStorage` — key `mycars_v3` |
| **Fonts** | Outfit + JetBrains Mono (Google Fonts CDN) |
| **Protocol** | Works over `file://` and HTTP/HTTPS |
| **Languages** | Czech / English |
| **Themes** | Dark (default) · Light · Glass/Frosted — toggle in Settings, persisted in `localStorage` |
| **Mobile** | Responsive — sidebar becomes slide-in drawer on screens ≤ 768px; modals become bottom sheets on screens ≤ 600px |
| **Touch targets** | Minimum 44 × 44 px on all interactive elements |
| **WCAG** | Text contrast ratios ≥ 4.5:1 on all three themes |
| **PWA** | Installable on iOS 16.4+ (Safari → Add to Home Screen) and Android/Chrome |
| **Service Worker** | Cache-first, offline-capable after first load; update detection with in-app toast notification |
| **Codebase** | `MyCars.html` (shell, styles) + `mycars.js` (logic, ~5 400 lines) + `mycars-sw.js` (service worker) |

### localStorage data structure

The `settings` object inside the stored JSON:

```json
"settings": {
  "tireReminders": true,
  "theme": "dark"
}
```

`theme` accepts `"dark"` (default), `"bright"` (Light mode optimised for direct sunlight), or `"glass"` (frosted glass mode with gradient background).

```json
{
  "cars": [
    {
      "id": "uid",
      "make": "Škoda", "model": "1000 MB", "year": 1967,
      "plate": "VET 1967", "vin": "...", "fuelType": "petrol",
      "status": "in_restoration",
      "classification": "veteran",
      "startOdo": 89450, "color": "#a86b3d",
      "stk": "2027-06-01", "stkWarn": 30,
      "emission": null, "emissionWarn": 30,
      "pov": null, "povWarn": 30,
      "insurance": "2026-05-01", "insuranceWarn": 30,
      "oilInterval": 10000, "oilLastKm": 89450, "oilWarn": 1000,
      "acquired": "2024-04-12", "decommissioned": null,
      "salePrice": null, "saleAdUrl": null,
      "note": ""
    }
  ],
  "records": [
    {
      "id": "uid", "carId": "...", "date": "2025-03-11",
      "odo": 89450, "desc": "Engine rebuild", "cat": "Servis a opravy",
      "qty": 1, "price": 47800, "note": "",
      "createdAt": "...", "updatedAt": "..."
    }
  ],
  "fuels": [
    {
      "id": "uid", "carId": "...", "date": "2025-06-21",
      "odo": 89512, "fuelTypeId": "p98", "liters": 23.4,
      "cost": 1029, "fullTank": true, "note": "",
      "createdAt": "..."
    }
  ],
  "reminders": [
    {
      "id": "uid", "carId": "...", "name": "Oil change",
      "type": "km", "interval": 10000, "lastDone": 89450, "warnAt": 1000
    }
  ],
  "jobs": [
    {
      "id": "uid", "carId": "...", "status": "planned",
      "shop": "Chromování Janáček",
      "startDate": "2026-08-03", "endDate": "2026-08-21",
      "estimatedCost": 22000, "notes": "",
      "tasks": [{ "text": "Demontáž lišt", "done": false }],
      "createdAt": "..."
    }
  ],
  "settings": { "tireReminders": true, "theme": "dark" },
  "lang": "cs",
  "savedAt": "2026-06-17T12:00:00.000Z"
}
```

#### Field reference

- `status` — one of `operational` · `storage` · `in_restoration` · `for_sale` · `sold` · `decommissioned`. Legacy `active` / `inactive` values from older backups are migrated on load and on import.
- `classification` — one of `standard` · `youngtimer` · `historic` · `veteran` (defaults to `standard` when missing).
- `salePrice`, `saleAdUrl` — optional; only used when `status === "for_sale"`.
- `jobs[].status` — `planned` · `in_progress` · `done` · `cancelled`.

> **Note:** Expense categories are stored internally in Czech (e.g. `"Provozní náplně"` = Fluids & consumables, `"Servis a opravy"` = Service & repairs). The UI displays translated names based on the selected language.

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
`mfgDate` → optional free-text manufacture date string per set (e.g. `"2023"` or DOT code `"2350"`).  
**Legacy format** (parameters directly on set root, pre-3.10.1) is automatically detected and treated as `same: true`.

---

## PWA — Service Worker & Updates

The Service Worker (`mycars-sw.js`) uses a **cache-first** strategy for the app shell.

- On first load over HTTPS, `MyCars.html` and `manifest.json` are cached.
- Subsequent loads are served instantly from cache — no network required.
- The browser checks `mycars-sw.js` for changes on every navigation. When the file changes (e.g. after a new release), the new SW installs in the background and purges the old cache.
- The app displays a toast: *"Update available — close and reopen the app"*.
- After closing all tabs and reopening, the new version is active.

**For developers:** Bump `CACHE_NAME` in `mycars-sw.js` with every release (e.g. `mycars-v5` → `mycars-v6`). This ensures stale caches are purged on all devices.

---

## License

GNU General Public License v3.0 — see [`LICENSE`](LICENSE).

**Additional term (GPL §7(b)):** All copies and modified versions must preserve the author attribution `Author / Autor: kraah` in the Settings / About section of the application's user interface. Modified versions must additionally be marked as changed per GPL §5(a).
