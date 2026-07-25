# Configurable Method Digit Coincidences Design

## Goal

Replace the fixed normal/inverso coincidence search with a configurable two-field search. Each field chooses which method to use and which exact parlet count to search. The app then compares the two result sets and shows only parlet pairs that have the same digit signature, regardless of order.

## User Behavior

- The `Coincidencias normal / inverso` panel becomes a configurable coincidence search.
- Field 1 has:
  - A method selector: `Normal` or `Inverso`.
  - A numeric count input, such as `7`.
- Field 2 has:
  - A method selector: `Normal` or `Inverso`.
  - A numeric count input, such as `9`.
- Both fields may use the same method if the user wants.
- Pressing `Buscar coincidencias` applies the search.
- The app first gets all parlets from each selected method whose historical count equals the entered value.
- The app then compares the resulting parlets from Field 1 against Field 2.
- The app shows only pairs where both parlets have the same digit signature, regardless of order.

## Calculation Rules

- Existing normal and inverse method generation stays unchanged.
- Existing parlet counting stays unchanged: a parlet counts when both two-digit numbers appear in the same drawing row, regardless of whether they appear as `Fijo`, `1er Corrido`, or `2do Corrido`.
- A digit coincidence is based on the full digit signature of the two parlets being compared.
- Digit order does not matter.
- Duplicate digits count as part of the signature, so `11 . 79` has signature `1179`, while `17 . 19` has signature `1179` and matches it.
- Examples:
  - `97 . 81` matches `79 . 18` because both have signature `1789`.
  - `92 . 31` matches `29 . 13` because both have signature `1239`.
  - `90 . 46` matches `09 . 64` because both have signature `0469`.
- If either count input is empty or invalid, that field has no searchable result set and the app shows an empty state.
- If no digit coincidences exist between the two filtered result sets, the app shows `No hay coincidencias para esos valores.`

## UI Placement

- Keep the same panel location beside `Rankings`.
- Rename field labels from fixed `Normal salio` and `Inverso salio` to neutral labels such as `Campo 1` and `Campo 2`.
- Each field uses a compact method selector and numeric input.
- Result rows show:
  - Field 1 parlet and count.
  - Field 2 parlet and count.
- The result list should make clear which method was used for each side.

## Testing

- Add unit tests for selecting normal or inverse parlet rows by exact count.
- Add unit tests for matching parlets by digit signature regardless of order.
- Cover same-method comparisons, such as normal count `7` against normal count `9`.
- Cover different-method comparisons, such as normal count `7` against inverse count `9`.
- Keep existing lottery calculation tests passing.
