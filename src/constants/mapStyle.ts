// -----------------------------------------------------------
// Mistella - Google Maps ダークスタイル定義
// Google Maps API は文字列 HEX を要求するため COLORS を参照して構築する。
// -----------------------------------------------------------

import { COLORS } from './colors';

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: COLORS.background }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: COLORS.background }] },
  { elementType: 'labels.text.fill', stylers: [{ color: COLORS.textSecondary }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.gold }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.textMuted }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0F1A14' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.textMuted }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: COLORS.surface }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: COLORS.border }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.textMuted }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: COLORS.surfaceLight }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: COLORS.border }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.textSecondary }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: COLORS.surface }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.neonBlue }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060C14' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.border }],
  },
];
