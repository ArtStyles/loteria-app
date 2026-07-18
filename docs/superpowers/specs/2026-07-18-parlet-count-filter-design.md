# Parlet Count Filter Design

## Goal

Add a user-controlled search to the NORMAL and INVERSO methods so the user can enter the exact number of times each parlet has appeared and find matching digit coincidences between both methods.

## User Behavior

- The analysis screen keeps showing the generated NORMAL and INVERSO numbers, parlet counts, rankings, and normal/inverse coincidences.
- Above the normal/inverse coincidence list, the app adds two numeric inputs:
  - `Normal salio`
  - `Inverso salio`
- Each input represents an exact historical parlet count, matching the notebook example where NORMAL may be set to `7` and INVERSO may be set to `9`.
- The user presses `Buscar coincidencias` to apply the search.
- The coincidence list then shows only rows where:
  - `normalCount` equals the NORMAL value, when that field has a value.
  - `inverseCount` equals the INVERSO value, when that field has a value.
- If either input is empty, that side is not filtered.
- If both inputs are empty, the full coincidence list is shown.
- If no rows match, the app shows `No hay coincidencias para esos valores.`

## Calculation Rules

- Existing parlet generation stays unchanged.
- Existing parlet counting stays unchanged: a parlet counts when both two-digit numbers appear in the same drawing row, regardless of whether they appear as `Fijo`, `1er Corrido`, or `2do Corrido`.
- The new behavior is a filter over `analysis.matches`, not a different parlet calculation.
- Count inputs accept whole numbers from `0` upward. Invalid or negative values are ignored in the filter and treated like an empty field.

## UI Placement

- Keep the current `Coincidencias normal / inverso` panel.
- Add a compact control row under that title with:
  - Numeric input for NORMAL count.
  - Numeric input for INVERSO count.
  - `Buscar coincidencias` button.
- The existing match rows keep their current layout: normal parlet, normal count, inverse parlet, inverse count.

## Testing

- Add a unit test for filtering matches by exact NORMAL and INVERSO counts.
- Cover the notebook-style case where NORMAL and INVERSO use different count values.
- Cover empty filter values showing all matches.
- Keep the existing lottery calculation tests passing.
