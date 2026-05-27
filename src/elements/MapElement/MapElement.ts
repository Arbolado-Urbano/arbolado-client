import { LngLatLike, Map, NavigationControl } from 'maplibre-gl'

import { SpeciesFilters } from '../../types/Species'

import { mapStyles } from '../../constants/mapStyles'

import GeoBtn from '../GeoBtn/GeoBtn'
import { MapLayerSwitcher } from '../MapLayerSwitcher/MapLayerSwitcher'
import { TreeLayer } from './TreeLayer'

export default class MapElement extends HTMLElement {
  private treesLayer?: TreeLayer
  private map = new Map({
    container: 'map',
    style: mapStyles,
    center: [-58.44, -34.618], // BsAs
    zoom: 12,
    maxZoom: 21,
    minZoom: 2,
  })

  constructor() {
    super()

    // Navigation controls
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-left')

    // Layer switcher
    this.map.addControl(new MapLayerSwitcher('streets'), 'bottom-right')

    // TODO: GEO button and rest of the UI, see if I can load all of them as a layer or something

    // Update map bounds on move
    this.map.on('move', () => {
      const bounds = this.map.getBounds()
      window.Arbolado.emitEvent(this, 'arbolado:map/move', { bounds })
    })

    this.map.on('load', async () => {
      // Initialize trees layer
      this.treesLayer = new TreeLayer(this.map, this)
      // Initialize Geo button
      const geoBtn = document.querySelector('[js-map-geo-btn]') as GeoBtn
      geoBtn.addEventListener('arbolado:geo/searching', () => window.Arbolado.setLoading(true))
      geoBtn.addEventListener('arbolado:geo/error', () => window.Arbolado.setLoading(false))
      geoBtn.addEventListener('arbolado:geo/success', (event) => {
        const { lat, lng } = event.detail
        this.center([lng, lat])
        window.Arbolado.setLoading(false)
      })

      window.Arbolado.emitEvent(this, 'arbolado:map/loaded')
    })
  }

  public center(center: LngLatLike, zoom?: number) {
    this.map.flyTo({ center, zoom })
  }

  public filterSpecies(filters: SpeciesFilters) {
    this.treesLayer?.filterSpecies(filters)
  }
}