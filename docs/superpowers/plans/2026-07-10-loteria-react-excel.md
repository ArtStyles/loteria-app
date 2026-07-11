# Loteria React Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local React and Express app that reads/writes `METODOS 3.xlsx` and calculates lottery methods over the full workbook.

**Architecture:** The backend owns Excel persistence through `exceljs`; the frontend calls JSON endpoints. Calculation rules live in small shared modules so tests can verify lottery behavior without the UI.

**Tech Stack:** React, Vite, Express, ExcelJS, Vitest, Lucide React.

## Global Constraints

- Keep `METODOS 3.xlsx` as the main database.
- Use the full historical database for all rankings and parlet counts.
- Add new drawings from the web UI into the Excel workbook.
- Reject invalid numbers, missing fields, invalid shifts, and duplicate date/shift rows.
- No production calculation code without a failing test first.

---

### Task 1: Project Scaffold And Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`
- Create: `server/index.js`
- Create: `src/lib/loteria.test.js`
- Create: `src/lib/loteria.js`

**Interfaces:**
- Produces: npm scripts `dev`, `server`, `test`, and `start`.
- Produces: `normalizeNumber(value): string`

- [ ] Create project metadata and scripts.
- [ ] Write a failing Vitest test for `normalizeNumber`.
- [ ] Run `npm test -- --run src/lib/loteria.test.js` and confirm it fails because the function is missing.
- [ ] Implement `normalizeNumber`.
- [ ] Re-run the test and confirm it passes.

### Task 2: Lottery Calculations

**Files:**
- Modify: `src/lib/loteria.test.js`
- Modify: `src/lib/loteria.js`

**Interfaces:**
- Consumes: `normalizeNumber(value): string`
- Produces: `getDrawDigits(numbers): { present: string[], missing: string[] }`
- Produces: `buildNormalCombinations(numbers): string[]`
- Produces: `buildInverseCombinations(numbers): string[]`
- Produces: `buildParlets(numbers): [string, string][]`
- Produces: `countParlet(drawings, pair): number`
- Produces: `rankNumbers(drawings): { hot: object[], cold: object[], frequent: object[], never: object[] }`

- [ ] Add failing tests for digit extraction, normal combinations, inverse combinations, parlet count examples, and rankings.
- [ ] Run the tests and confirm expected failures.
- [ ] Implement the calculation functions.
- [ ] Re-run tests and confirm they pass.

### Task 3: Excel Persistence API

**Files:**
- Create: `server/workbook.js`
- Create: `server/workbook.test.js`
- Modify: `server/index.js`

**Interfaces:**
- Consumes: calculation modules from `src/lib/loteria.js`
- Produces: `readDrawings(workbookPath): Promise<Drawing[]>`
- Produces: `appendDrawing(workbookPath, drawing): Promise<Drawing[]>`
- Produces API routes: `GET /api/drawings`, `POST /api/drawings`, `GET /api/analysis`

- [ ] Add failing tests using a temporary workbook for reading and duplicate rejection.
- [ ] Run backend tests and confirm expected failures.
- [ ] Implement workbook reading, appending, validation, and Express routes.
- [ ] Re-run backend tests and confirm they pass.

### Task 4: React UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes API routes from Task 3.
- Produces visible sections: Database, Methods, Parlets, Analysis, Rankings.

- [ ] Build the app shell and data loading states.
- [ ] Add drawing form with validation feedback from the API.
- [ ] Add table and filters.
- [ ] Add method analysis panels.
- [ ] Add rankings panels.
- [ ] Verify manually in browser after starting both servers.

### Task 5: Verification

**Files:**
- Modify as needed only for failures found during verification.

**Interfaces:**
- Consumes all tasks.
- Produces a working local app.

- [ ] Run `npm test -- --run`.
- [ ] Start the backend.
- [ ] Start Vite.
- [ ] Confirm the app loads data from `METODOS 3.xlsx`.
- [ ] Confirm adding a duplicate drawing fails.
- [ ] Confirm analysis contains the known examples `39 . 85 = 15` and `93 . 58 = 14`.

