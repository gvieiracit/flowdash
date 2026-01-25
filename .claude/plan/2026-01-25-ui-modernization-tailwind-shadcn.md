# UI Modernization: Tailwind CSS + shadcn/ui Integration

**Date:** 2026-01-25
**Status:** Planning
**Scope:** Cards, Tables, Forms, Theme System

---

## Executive Summary

Modernize FlowDash's UI to a contemporary look using Tailwind CSS with shadcn/ui theming approach. The goal is to improve visual appearance (cards, spacing, borders, colors, tables, forms) while preserving functionality and graph chart implementations.

---

## Current State Analysis

### Tech Stack (UI-related)
| Component | Library | Version |
|-----------|---------|---------|
| Styling Base | Tailwind CSS | 3.3.2 |
| Design Tokens | Neo4j Design Language (NDL) | 1.10.3 |
| Component Library | @neo4j-ndl/react | 1.10.8 |
| Complex Components | Material-UI | 5.12.3 |
| Tables | @mui/x-data-grid | 7.4.0 |
| CSS-in-JS | styled-components | 5.3.3 |
| Form Controls | NDL (TextInput, Dropdown, Textarea) | - |

### Current Implementation Details

**Forms (`src/component/field/Field.tsx`):**
- Uses `@neo4j-ndl/react` components: `TextInput`, `Dropdown`, `Textarea`
- Inline styles with fixed widths/margins
- Basic appearance, no modern styling

**Tables (`src/chart/table/TableChart.tsx`):**
- Uses MUI DataGrid (`@mui/x-data-grid`)
- Custom theme with Nunito Sans font
- Rule-based styling for rows/cells
- Features: pagination, sorting, CSV download, column visibility

**Cards (`src/card/Card.tsx`):**
- MUI Card with Tailwind/NDL classes
- Classes: `n-bg-neutral-bg-weak`, `n-shadow-l4`, `border-neutral-border-strong`
- Uses MUI Collapse for settings animation

**Tailwind Config:**
- Extends NDL base preset
- Custom CI&T colors defined (primary, accent, cyan)
- Custom shadows and border radius

---

## Proposed Approach

### Option 1: Theme-Only Modernization (Recommended)
**Risk Level: LOW**

Update Tailwind configuration to use shadcn/ui-style CSS variables and theming without replacing existing component libraries.

**Pros:**
- Minimal breaking changes
- Keeps NDL/MUI functionality intact
- Fast implementation
- Easy theme customization via CSS variables
- Compatible with tweakcn.com theme editor

**Cons:**
- Won't achieve full shadcn component aesthetics
- Still mixing multiple styling systems

### Option 2: Incremental Component Migration
**Risk Level: MEDIUM**

Gradually replace NDL components with custom Tailwind/shadcn-styled components.

**Pros:**
- Modern component aesthetics
- Cleaner codebase over time
- Full control over styling

**Cons:**
- Requires more testing
- Longer implementation time
- Must maintain backward compatibility

### Option 3: Full shadcn/ui Integration
**Risk Level: HIGH**

Install shadcn/ui CLI and systematically replace all UI components.

**Pros:**
- Consistent modern design system
- Well-documented components
- Active community support

**Cons:**
- Major refactoring effort
- High risk of breaking existing functionality
- NDL removal could break dependent features
- MUI DataGrid replacement would lose features

---

## Recommended Implementation Plan (Option 1 + Selective Option 2)

### Phase 1: Theme Foundation (Low Risk)

**1.1 Update Tailwind Configuration**
- Add shadcn/ui CSS variable structure
- Define color palette using HSL format
- Configure radius, spacing, shadows
- Enable dark mode support via CSS variables

**1.2 Global CSS Variables**
Create theme CSS file with:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

**1.3 Configure tweakcn.com Compatibility**
- Export/import theme JSON from tweakcn.com
- Document theme customization workflow

### Phase 2: Card Styling (Low Risk)

**2.1 Update Card Component**
- Replace NDL shadow classes with CSS variable-based shadows
- Update border colors and radius
- Improve spacing consistency
- Keep MUI Card wrapper for collapse functionality

**2.2 Card Header/Footer Styling**
- Modern typography
- Better icon/button alignment
- Consistent padding

### Phase 3: Table Styling (Medium Risk)

**3.1 MUI DataGrid Theme Override**
- Create custom MUI theme using CSS variables
- Update header styling
- Improve row/cell appearance
- Better pagination styling

**3.2 Keep Existing Features**
- Preserve column visibility toggle
- Preserve CSV download
- Preserve styling rules system
- Preserve checkbox selection

### Phase 4: Form Components (Medium Risk)

**4.1 Create Modern Form Primitives**
New styled wrappers or replacements for:
- Input (text, number, password)
- Textarea
- Select/Dropdown
- Checkbox
- Button variants

**4.2 Update NeoField Component**
- Option A: Style NDL components via CSS
- Option B: Create shadcn-style replacements
- Maintain same props interface

**4.3 Update Form Layout**
- Consistent spacing
- Better label positioning
- Focus states
- Error states

---

## Impact Assessment

### Files to Modify

| Category | Files | Risk |
|----------|-------|------|
| Config | `tailwind.config.js` | Low |
| Styles | `src/index.pcss` (new CSS vars) | Low |
| Cards | `src/card/Card.tsx` | Low |
| Cards | `src/card/view/CardViewHeader.tsx` | Low |
| Cards | `src/card/view/CardViewFooter.tsx` | Low |
| Tables | `src/chart/table/TableChart.tsx` | Medium |
| Forms | `src/component/field/Field.tsx` | Medium |
| Forms | `src/extensions/forms/chart/NeoForm.tsx` | Medium |
| Forms | `src/chart/parameter/ParameterSelectionChart.tsx` | Medium |

### Components NOT to Modify
- Graph charts (`src/chart/graph/`)
- Nivo visualizations (bar, line, pie, etc.)
- Map components
- Core Redux logic
- Extension system

### Testing Requirements
1. Visual regression testing for all card types
2. Form functionality testing (submit, validation)
3. Table features (pagination, sorting, export)
4. Theme switching (if dark mode enabled)
5. Responsive behavior

### Rollback Strategy
- All changes in feature branch
- CSS variable approach allows easy rollback
- No structural changes to components
- Preserve original class names as fallback

---

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| NDL dependency breaks | High | Low | Keep NDL, layer CSS on top |
| MUI DataGrid styling conflicts | Medium | Medium | Use MUI ThemeProvider |
| Form validation breaks | High | Low | Test thoroughly |
| Performance degradation | Low | Low | CSS-only changes |
| Dark mode inconsistency | Medium | Medium | Comprehensive CSS vars |

---

## Success Criteria

1. Modern, clean appearance matching shadcn/ui aesthetic
2. Theme customizable via CSS variables
3. Compatible with tweakcn.com theme editor
4. All existing functionality preserved
5. No breaking changes to graph charts
6. Tables remain fully functional
7. Forms work identically (just look better)

---

## Questions for User

1. **Theme preference**: Light-only, dark-only, or both?
2. **Color scheme**: Keep CI&T brand colors or use new palette?
3. **Priority order**: Cards first, then tables, then forms?
4. **Testing approach**: Manual testing sufficient or need automated visual tests?
5. **Timeline constraints**: Any deadline for completion?

---

## Next Steps

Once approved:
1. Create detailed specification in `.claude/spec/`
2. Create feature branch
3. Implement Phase 1 (Theme Foundation)
4. Review and test
5. Proceed with subsequent phases
