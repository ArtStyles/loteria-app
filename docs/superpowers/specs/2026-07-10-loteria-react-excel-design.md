# Loteria React Excel Design

## Goal

Build a local web application that keeps `METODOS 3.xlsx` as the main database, lets the user add new lottery drawings from the browser, and calculates the normal/inverse digit-combination methods against the full historical database.

## Source Workbook

- Workbook: `METODOS 3.xlsx`
- Database sheet: `BASE DATOS FLORIDA`
- Columns: `Fecha`, `Tarde/Noche`, `Fijo`, `1er Corrido`, `2do Corrido`
- Current historical range observed: May 19, 2008 through April 7, 2026

## Core Behavior

- Read all drawings from the Excel workbook.
- Add a drawing from the web UI and append it to the workbook.
- Reject missing values, invalid shifts, numbers outside `00` through `99`, and duplicate `Fecha + Tarde/Noche` rows.
- Generate normal digit combinations from the three selected numbers.
- Generate inverse combinations by reversing each two-digit result.
- Count parlets by checking whether two numbers appeared together in the same drawing row, regardless of whether each number was `Fijo`, `1er Corrido`, or `2do Corrido`.
- Calculate rankings over the full database.

## Screens

- Database: searchable table and add-drawing form.
- Methods: selected drawing/manual input, digits found, digits missing, normal combinations, inverse combinations.
- Parlets: pair frequency table for normal and inverse combinations.
- Analysis: matching digit relationships between normal and inverse pairs.
- Rankings: hottest, coldest, most frequent, and never-seen numbers.

## Architecture

- React frontend for the browser UI.
- Express backend for workbook reads/writes.
- `exceljs` for preserving the workbook and appending rows.
- Shared calculation logic in plain JavaScript modules covered by Vitest tests.

