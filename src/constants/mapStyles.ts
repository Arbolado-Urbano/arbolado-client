import { StyleSpecification } from 'maplibre-gl'

export const mapStyles: StyleSpecification = {
  version: 8,
  sources: {
    streets: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 21,
    },
    satellite: {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`,
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'streets',
      type: 'raster',
      source: 'streets',
      layout: { visibility: 'visible' },
    },
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      layout: { visibility: 'none' },
    },
  ],
};