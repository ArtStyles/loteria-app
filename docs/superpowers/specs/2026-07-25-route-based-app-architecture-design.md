# Route-Based App Architecture Design

## Goal

Turn the current single-page long dashboard into a route-based application where each main workflow has its own screen. The app should feel more professional, easier to scan, and easier for the user to navigate without scrolling through unrelated panels.

## Approved Direction

Use real client-side routes with React Router and clean URLs. The app will keep one shared data/analysis source, but each route will present only the information needed for that workflow.

## Route Map

- `/`
  - Short home screen, not a dashboard.
  - Shows database connection status, total loaded drawings, latest drawing, and quick access buttons.
- `/base-datos`
  - Shows the drawing database table and filter.
  - Includes Excel upload controls.
- `/tiradas`
  - Shows the new drawing form.
  - Includes manual analysis controls for entering three numbers and recalculating methods.
- `/metodos/digitos`
  - Shows only present and missing digits from the selected/latest drawing.
- `/metodos/normal`
  - Shows only the normal method numbers.
  - Uses a clear grid/list with enough space to scan generated numbers.
- `/metodos/inverso`
  - Shows only the inverse method numbers.
  - Uses the same visual structure as the normal method route.
- `/coincidencias`
  - Shows the configurable method/count coincidence search.
  - Keeps the current rule: each field chooses `Normal` or `Inverso` plus an exact count, then results are compared by full digit signature regardless of order.

## Layout

- The app uses a persistent shell:
  - Top bar with app name, update button, and loaded drawing status.
  - Primary navigation with links to Home, Base de datos, Tiradas, Digitos, Normal, Inverso, and Coincidencias.
  - Main content area for the current route.
- Navigation must clearly show the active route.
- The layout remains responsive:
  - Desktop: navigation and content have room to breathe.
  - Mobile: navigation wraps or stacks without overlapping text.

## Data Flow

- Data loading remains shared at the app shell level.
- The app loads drawings and analysis once on startup.
- Routes receive shared state and handlers from the shell or a local hook.
- Recalculating analysis from manual numbers updates the shared analysis, so method and coincidence routes reflect the current selected/manual drawing.
- Existing API endpoints remain unchanged:
  - `/api/drawings`
  - `/api/analysis`
  - `/api/workbook`

## Component Structure

- `App` becomes the route shell.
- Extract reusable route/view components from the current large `src/main.jsx`.
- Recommended components:
  - `AppShell`
  - `HomeView`
  - `DatabaseView`
  - `DrawingsView`
  - `DigitsView`
  - `MethodView`
  - `CoincidencesView`
  - `NumberInput`
  - `MethodPanel` or a renamed method-number grid component.
- Keep calculation helpers in `src/lib/loteria.js`.
- Avoid moving server or Excel persistence logic unless required for routing.

## Server And Hosting Behavior

- Client-side routes must load directly in development and production.
- The local Node server must serve `index.html` for non-API routes such as `/metodos/normal`.
- Vite development must keep proxying `/api` to the local server.
- API routes keep their existing behavior and must not be swallowed by the client-side fallback.

## Visual Direction

- Avoid one huge stacked dashboard.
- Each route should have one primary job.
- Keep the UI utilitarian and focused:
  - compact panels,
  - readable controls,
  - dense but organized data,
  - no marketing-style hero sections.
- Method screens should use stable grid/list dimensions so generated numbers do not resize or shift awkwardly.
- Coincidence rows must keep method labels and counts visible.

## Error Handling

- Loading overlay remains global.
- API errors remain visible in the shell.
- Empty route states should be explicit:
  - no drawings loaded,
  - no analysis available,
  - no coincidences for selected values.
- Unknown client routes should show a simple not-found screen with a link back home.

## Testing And Verification

- Existing unit tests must keep passing.
- Add or update tests only where route-support logic is pure and testable.
- Manual browser verification must cover:
  - direct load of `/`,
  - direct load of `/metodos/normal`,
  - navigation between all route links,
  - manual analysis from `/tiradas` updates method routes,
  - `/coincidencias` still filters by selected methods and counts,
  - local server fallback does not break `/api` endpoints.

## Out Of Scope

- No authentication.
- No new database model.
- No changes to Excel workbook format.
- No redesign of lottery calculation rules.
- No reintroducing rankings or parlet summary tables.
