# Full Ride — Scholarship Intelligence

A static single-page application for high-achieving undergraduate applicants researching merit scholarships and full-ride programs at the world's most selective universities. Filter 31 institutions by region, scholarship type, GPA threshold, and olympiad recognition; click any card to open a detail modal with a live probability estimator that rates your admission and scholarship chances as Reach / Possible / Likely based on your GPA and SAT score.

## Local development

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Stack

- Vite + React (JSX)
- Zero dependencies beyond React
- All data hardcoded in `src/data/universities.json`
- Single CSS file, no component libraries, no Tailwind
