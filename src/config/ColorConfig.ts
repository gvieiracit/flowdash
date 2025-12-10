import {
  schemeCategory10,
  schemeAccent,
  schemeDark2,
  schemePaired,
  schemePastel1,
  schemePastel2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemeYlOrRd,
  schemeGreens,
  schemeBrBG,
  schemeRdYlGn,
} from 'd3-scale-chromatic';

export const categoricalColorSchemes = {
  ciandt: [
    '#000050', // Primary Navy
    '#E94E47', // Accent Coral
    '#00B8D4', // Accent Cyan
    '#6B7280', // Text Gray
    '#10B981', // Success Green
    '#F59E0B', // Warning Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#3B82F6', // Blue
    '#84CC16', // Lime
  ],
  neodash: [
    '#588c7e',
    '#f2e394',
    '#f2ae72',
    '#d96459',
    '#5b9aa0',
    '#d6d4e0',
    '#b8a9c9',
    '#622569',
    '#ddd5af',
    '#d9ad7c',
    '#a2836e',
    '#674d3c',
  ],
  nivo: ['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5'],
  category10: schemeCategory10,
  accent: schemeAccent,
  dark2: schemeDark2,
  paired: schemePaired,
  pastel1: schemePastel1,
  pastel2: schemePastel2,
  set1: schemeSet1,
  set2: schemeSet2,
  set3: schemeSet3,
  BrBG: schemeBrBG,
  RdYlGn: schemeRdYlGn,
  YlOrRd: schemeYlOrRd,
  greens: schemeGreens,
};

export const getD3ColorsByScheme = (scheme) => categoricalColorSchemes[scheme];
