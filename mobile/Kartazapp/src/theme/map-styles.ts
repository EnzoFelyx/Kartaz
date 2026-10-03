import type { MapStyleElement, Region } from 'react-native-maps';

import { colors, withAlpha } from './colors';

/**
 * Configurações customizadas do mapa (react-native-maps + PROVIDER_GOOGLE).
 *
 * Visual: monocromático e dessaturado, em tons de cinza-azulado (slate),
 * como o mapa vintage do protótipo. Os sinais/cartas em ciano se destacam sobre ele.
 */

/** Paleta exclusiva do mapa (tons slate dessaturados). */
export const mapPalette = {
  land: '#5b606b',
  landManMade: '#555a64',
  water: '#2e323a',
  border: '#7d838e',
  road: '#4a4f58',
  label: '#a3a8b1',
  labelStroke: '#3f434b',
  waterLabel: '#80858f',
  gridLine: withAlpha(colors.primary, 0.1),
} as const;

/** Estilo padrão do Kartaz: slate monocromático, sem POIs, transporte nem ícones. */
export const kartazMapStyle: MapStyleElement[] = [
  // Tira toda a cor do mapa base.
  { stylers: [{ saturation: -100 }] },

  { elementType: 'geometry', stylers: [{ color: mapPalette.land }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: mapPalette.label }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: mapPalette.labelStroke }] },

  // Fronteiras e divisões administrativas.
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: mapPalette.border }, { weight: 0.6 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: mapPalette.border }, { weight: 1 }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  // Sem nomes de países, estados, cidades e bairros.
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  // Terra.
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: mapPalette.land }] },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: mapPalette.landManMade }],
  },

  // Remove ruído: pontos de interesse (locais, inclusive nomes) e transporte público.
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  // Ruas discretas, com nomes de ruas e avenidas em ciano (cor primária do app).
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: mapPalette.road }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: colors.primary }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: mapPalette.labelStroke }] },

  // Água.
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: mapPalette.water }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: mapPalette.waterLabel }] },
];

/** Região inicial: visão ampla do Atlântico (Américas, Europa e África na tela). */
export const initialMapRegion: Region = {
  latitude: 20,
  longitude: -30,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

/** Props fixas do MapView: sem controles nativos, para o HUD do jogo dominar a tela. */
export const mapViewConfig = {
  showsCompass: false,
  showsScale: false,
  showsBuildings: false,
  showsTraffic: false,
  showsIndoors: false,
  showsPointsOfInterests: false,
  showsMyLocationButton: false,
  toolbarEnabled: false,
  pitchEnabled: false,
  rotateEnabled: false,
} as const;
