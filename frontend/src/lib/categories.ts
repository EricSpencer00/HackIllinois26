/**
 * Category definitions for the planet roulette.
 * Each category gets a unique Three.js geometry and position on the ring.
 */

export interface Category {
  name: string;
  geometry: string;
  /** Short label for UI */
  label: string;
}

export const CATEGORIES: Category[] = [
  { name: 'Politics',          geometry: 'icosahedron',   label: 'POL' },
  { name: 'Sports',            geometry: 'sphere',        label: 'SPT' },
  { name: 'Crypto',            geometry: 'octahedron',    label: 'CRY' },
  { name: 'Finance',           geometry: 'box',           label: 'FIN' },
  { name: 'Geopolitics',       geometry: 'dodecahedron',  label: 'GEO' },
  { name: 'Earnings',          geometry: 'cylinder',      label: 'ERN' },
  { name: 'Tech',              geometry: 'torus',         label: 'TCH' },
  { name: 'Culture',           geometry: 'cone',          label: 'CLT' },
  { name: 'World',             geometry: 'sphereSmall',   label: 'WLD' },
  { name: 'Economy',           geometry: 'torusKnot',     label: 'ECO' },
  { name: 'Climate & Science', geometry: 'tetrahedron',   label: 'SCI' },
  { name: 'Mentions',          geometry: 'ring',          label: 'MEN' },
  { name: 'Other',             geometry: 'sphereWire',    label: 'OTH' },
];

/** Data source subcategories that appear after planet explosion */
export const SUBCATEGORIES = [
  { key: 'finnhub',      label: 'Market Data',    geometry: 'box' },
  { key: 'technicals',   label: 'Technicals',     geometry: 'octahedron' },
  { key: 'coingecko',    label: 'Crypto',         geometry: 'dodecahedron' },
  { key: 'fearGreed',    label: 'Fear & Greed',   geometry: 'sphere' },
  { key: 'confidence',   label: 'Confidence',     geometry: 'icosahedron' },
  { key: 'polymarket',   label: 'Predictions',    geometry: 'tetrahedron' },
  { key: 'reddit',       label: 'Reddit',         geometry: 'icosahedronSmall' },
  { key: 'googleTrends', label: 'Trends',         geometry: 'torus' },
  { key: 'fred',         label: 'Macro',          geometry: 'cylinder' },
] as const;
