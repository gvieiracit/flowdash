# Form Widget UI Improvements

## Overview
Improve the Form widget UI with better spacing, a CSS Grid layout for flexible field arrangement, and a submit button pinned to the bottom.

## User Requirements
1. Better spacing, layout, margin, padding for alignment and readability
2. Submit button always aligned at the bottom of the widget
3. Yes/No dropdown fields should be smaller and positioned on the same row (grid layout)

## Current Issues
- **Inconsistent spacing**: FreeText has `marginBottom: 20px`; Autocomplete has `marginTop: 5px, marginLeft: 15px`
- **Submit button floats**: Positioned inline with content, not pinned to bottom
- **No grid layout**: Fields always stack vertically; small dropdowns can't share rows
- **No field width control**: All fields expand to full width regardless of content

## Proposed Solution

### 1. Add Field Width Setting
Each form field will have a configurable width:
- **Full Width** (default) - Takes entire row
- **Half Width** - 50% width, two fields can share a row
- **Third Width** - 33% width, three fields can fit per row

### 2. CSS Grid Layout
Replace the current simple div stack with a CSS Grid:
- 6-column grid for flexible arrangement
- Full width = span 6, Half = span 3, Third = span 2
- Consistent 12px gap between all fields

### 3. Flexbox Container
Wrap the form in a flexbox column:
- Fields container grows to fill space
- Submit button uses `marginTop: auto` to pin to bottom

### 4. Standardize Field Margins
Remove individual margins from field components:
- Grid handles all spacing via `gap` property
- Fields set to `width: 100%` to fill their grid cells

## Impact
- Improved visual consistency across all form types
- Users can configure Yes/No dropdowns side-by-side
- Submit button always visible at predictable location
- Better use of horizontal space in wider widgets
