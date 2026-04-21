# ROI Tool

Chesterton-branded Total Cost of Ownership (TCO) calculator that compares a customer's **current** solution against a proposed **Chesterton** solution over a configurable horizon, then produces an executive PDF report.

Lives inside the broader Case Study Generator React/Vite app (PIN-gated, `App.jsx` routes to `RoiApp` via `LandingPicker`). All ROI code is isolated under [src/roi/](src/roi/).

## User flow

1. **Customer & solution** — metadata (customer, industry, application, labels for side A/B, prepared-by, date, **currency**).
2. **Horizon, mode & sensitivity** — horizon in years (1–15) + mode toggle + sensitivity segmented control:
   - `projected` — pure hypothetical forecast.
   - `tracked` — overlays actual-to-date alongside the original projection for `elapsedMonths`.
   - `sensitivity`: `conservative | expected | aggressive` scales Chesterton's advantage via `Bnew = A − (A − B) × mul` (multipliers `0.7 / 1 / 1.2`). `expected` is the headline number; the other two drive the confidence band.
3. **Cost scenarios** — two side-by-side `ScenarioCard`s (A = Current, B = Chesterton). Each holds any number of cost items. Items can share a **`categoryId`** to pair A ↔ B in the PDF side-by-side table. "Clone from" copies items between sides.
4. **Results** — KPI tiles + cumulative-vs-annual toggle; cumulative view includes savings-zone shading, Chesterton confidence band, and a dashed payback marker.
5. **Notes** — free-form caveats/assumptions.
6. **Save / Export** — `.roi.json` round-trip, branded PDF (via print-to-PDF), or a URL-hash **share link** that carries the whole ROI in the URL.

State persists in `localStorage` under `chesterton_roi_state_v1` ([useRoiState.js](src/roi/hooks/useRoiState.js)). An **undo stack** (20 deep, 400 ms debounced) covers structural changes (add/remove/clone/replace/reset); meta keystrokes are not pushed.

## Cost item types

Defined in [src/roi/lib/costItems.js](src/roi/lib/costItems.js). Each item has a `typeId`, type-specific fields, and a set of **shared fields** on every type.

| typeId        | Fields                                                          | Base annual cost formula                         |
|---------------|-----------------------------------------------------------------|--------------------------------------------------|
| `oneTime`     | `amount`, `occursAt` (month index)                              | `amount` (applied at `occursAt` only)            |
| `recurring`   | `amount`, `frequency` (year/quarter/month), `timesPerPeriod`    | `amount × timesPerYear`                          |
| `consumption` | `rate`, `rateUnit`, `hoursPerYear`, `unitPrice`                 | `rate × hoursPerYear × unitPrice`                |
| `downtime`    | `eventsPerYear`, `hoursPerEvent`, `hourlyRate`                  | `eventsPerYear × hoursPerEvent × hourlyRate`     |
| `energy`      | `kW`, `loadFactor`, `hoursPerYear`, `pricePerKwh`, `co2eKgPerKwh` | `kW × loadFactor × hoursPerYear × pricePerKwh` |

**Shared fields** (on every item, via `COMMON_DEFAULTS`):

- `escalationPct` — annual cost escalation. `annualCostInYear(item, yearIndex) = baseAnnualCost × (1 + esc/100)^yearIndex`.
- `categoryId` — free-text tag used to pair items across A and B in the PDF breakdown. Drawer offers autocomplete from both scenarios.
- `sourceNote` — optional provenance string surfaced as a badge on the row and a `Source` column in the PDF.
- `isInvestment` — drives the ROI-percent denominator. Defaults to `true` for `oneTime` only; can be overridden on any row (see `Calculation engine`).
- `actualEvents` — list of `{ date, amount, note }` entries used in `tracked` mode (legacy single `actual` is migrated through the drawer).

Helpers in `costItems.js`: `baseAnnualCost`, `annualCostInYear`, `monthlyCostAt` (escalation-aware), `annualEnergyKwh`, `annualCo2eKg`, `actualToDate` (prefers events, falls back to legacy single value).

## Calculation engine

[src/roi/lib/calc.js](src/roi/lib/calc.js) — `computeRoi({ horizonYears, scenarioA, scenarioB, mode, elapsedMonths, sensitivity })`:

- Builds monthly series for each side (`projected` + `blended` for tracked mode — blended replaces the first `elapsedMonths` with `actualToDate / elapsedMonths` when any `actualEvents` are present).
- Applies the sensitivity multiplier symmetrically to the A→B delta (`applyMultiplier(a, b, mul)`) and cumulates to produce `chartData` rows:
  - `current`, `chesterton` — headline lines.
  - `currentActual`, `chestertonActual` — tracked-mode overlays.
  - `savingsBand: [chesterton, current]` — range Area between the two headline lines (savings-zone shading).
  - `chestertonBand: [low, high]` — range Area built from conservative/aggressive recomputation (confidence band).
- Also emits `yearlyData` for the annual-spend bar view.
- Derives KPIs:
  - `tcoA`, `tcoB` — final cumulative cost on each side.
  - `savings` = `tcoA − tcoB`.
  - `roiPct` = `savings / (sum of items where isInvestment on B, falling back to oneTime) × 100` (null if no investment basis).
  - `paybackMonths`, `paybackReason` — via `computePayback(cumA, cumB, months)` returning `'immediate' | 'crossover' | 'none' | 'flat'`. `<0.5 mo` formats as "Immediate".
  - `annualizedSavings` = `savings / horizonYears`.
  - `downtimeHoursAvoided` — downtime item hours/yr × horizon, A minus B (floored at 0).
  - `energyKwhAvoided`, `co2eKgAvoided` — summed over energy items, A minus B (floored at 0); surfaced as KPI tiles only when positive.

Sensitivity multipliers: `SENSITIVITY_MULTIPLIERS = { conservative: 0.7, expected: 1, aggressive: 1.2 }`.

## Export / import / share

- **`.roi.json`** ([serialize.js](src/roi/lib/serialize.js)) — versioned (`ROI_SCHEMA_VERSION = 2`) round-trippable snapshot. Import runs through `validateAndNormalizeState` ([validate.js](src/roi/lib/validate.js)), which migrates v1 states forward (injects `escalationPct`, `sourceNote`, `categoryId`, `actualEvents`, `isInvestment`, `currency`, `sensitivity`). Newer schemas are rejected.
- **PDF report** ([printReport.js](src/roi/lib/printReport.js)) — opens a popup with an inline-styled HTML report and auto-triggers `window.print()`. Chart is rendered as **inline SVG** built from raw `chartData` (not from the Recharts DOM) so the PDF is pixel-stable. Includes: executive-summary paragraph, KPI tiles, SVG chart with savings-zone polygon + confidence-band polygon + dashed payback marker, **paired-category side-by-side table** with delta column, per-side item breakdown (with `Source` column when any `sourceNote` is set), notes, and a footer.
- **Share link** ([share.js](src/roi/lib/share.js)) — base64-url JSON encoded into the URL hash via `buildShareUrl(state)`. On mount, `RoiApp` reads `readShareFromHash()`, loads state, shows a banner, and calls `clearShareHash()` so the URL stays clean. Undo history is preserved so the user's prior work is recoverable.
- **Anonymize** toggle replaces `customerName` → `"Customer A"` and clears `location` in PDF, JSON, and share-link exports.

## File map

```
src/roi/
  RoiApp.jsx                    — top-level page, wires state → sections → export + share-hash loader
  hooks/useRoiState.js          — state + localStorage + undo stack + sample seed
  reference/
    industries.json             — industry autocomplete options
    product-lines.json          — Chesterton product-line suggestions
  lib/
    calc.js                     — computeRoi, sensitivity, payback reasons, currency/month formatters
    costItems.js                — COST_TYPES registry (incl. energy), escalation, energy/CO₂e, actualToDate
    serialize.js                — .roi.json save/load (schema v2)
    validate.js                 — validateAndNormalizeState + v1→v2 migration + HORIZON_MIN/MAX
    share.js                    — URL-hash share link encode/decode
    theme.js                    — shared TOKENS + CURRENCIES registry (USD/EUR/GBP/CAD/AUD/JPY/BRL/MXN)
    printReport.js              — HTML/SVG report + window.print (executive summary, paired table, SVG band)
  components/
    MetaBlock.jsx               — customer/solution metadata + currency select
    ModeToggle.jsx              — projected/tracked + horizon (1–15) + elapsed months + sensitivity
    ScenarioCard.jsx            — per-side list of cost items + add/clone
    CostItemRow.jsx             — summary row with inline-edit on primary field, category + source chips
    CostItemDrawer.jsx          — edit modal: type-specific + shared fields + tracked event log
    costTypes/
      OneTimeFields.jsx
      RecurringFields.jsx
      ConsumptionFields.jsx
      DowntimeFields.jsx
      EnergyFields.jsx          — kW, load factor, hours, $/kWh, CO₂e factor
    ResultsPanel.jsx            — KPI grid + cumulative/annual view toggle + confidence-band toggle
    MobileResultsSticky.jsx     — condensed KPI bar, tap to expand full KPI grid
    ExportModal.jsx             — anonymize + PDF/JSON/share-link export dialog
  ui/fields.jsx                 — shared Button/Input/Select/Checkbox/Textarea primitives
```

## Conventions

- Brand red: `#c8102e` (Chesterton side). Neutral grey: `#6e6e73` (Current side). Savings green: `#15803d`. Shared tokens in `lib/theme.js`.
- All currency formatting goes through `formatCurrency` / `formatShortMoney` in `calc.js` and respects the state-level `currency` via `Intl.NumberFormat`.
- The in-app chart uses **Recharts** (`ComposedChart` with range Areas + ReferenceLine); the PDF chart is **hand-built SVG** from the same `chartData` (polygons for savings shade + confidence band, vertical payback marker). Keep them visually aligned but don't try to share DOM.
- Undo pushes are structural only (upsert/remove/clone/replace/reset), debounced at 400 ms with a 20-entry limit.
- No backend for the ROI tool — everything is client-side. Server routes under [api/](api/) (`submit.js`, `generate-title.js`) belong to the Case Study Generator. The legacy `api/roi-export.js` has been removed; the former `lib/pptx.js` has also been removed.
