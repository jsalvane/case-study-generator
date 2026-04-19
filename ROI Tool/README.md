# ROI Calculator — IT Handoff Notes

The ROI Calculator is a second module inside the Case Study Generator app. To lift it into its own deploy, move the following together:

- `src/roi/` — React surface, calc engine, hooks, UI primitives
- `api/roi-export.js` — PPTX export endpoint (requires `pptxgenjs`)
- `src/components/LandingPicker.jsx` — optional (only if the destination still needs a tool picker)
- This folder (`ROI Tool/`) — reference data and brand assets specific to ROI

## Dependencies added to `package.json`
- `recharts` — chart rendering
- `pptxgenjs` — server-side PPTX generation

## Persistence
v1 ships with JSON export/import only (`.roi.json`). No backend storage. `useRoiState` persists the current session to `localStorage` under `chesterton_roi_state_v1`.

## Auth
Shares the existing PIN gate (`chesterton_casestudy_auth` session key).
