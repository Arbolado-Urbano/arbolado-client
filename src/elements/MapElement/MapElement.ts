import { Map, NavigationControl } from 'maplibre-gl'

import Tree from '../../types/Tree'

import { mapStyles } from '../../constants/mapStyles'

import { MapMarker } from './MapMarker'
import { TreeLayer } from './TreeLayer'
import GeoBtn from '../GeoBtn/GeoBtn'
import { MapLayerSwitcher } from '../MapLayerSwitcher/MapLayerSwitcher'

export default class MapElement extends HTMLElement {
  private readonly MARKER_RADIUS = 1000
  private marker?: MapMarker
  private trees?: TreeLayer
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

    // Set/update marker position on click
    this.map.on('click', (event) => {
      // If a tree was clicked don't reposition the marker
      if (this.map.queryRenderedFeatures(event.point, { layers: ['trees-layer'] }).length > 0) return
      this.setMarker([event.lngLat.lng, event.lngLat.lat])
    })

    this.map.on('load', async () => {
      // Initialize map marker
      this.marker = new MapMarker(this.map, this)
      // Initialize trees layer
      this.trees = new TreeLayer(this.map, this)
      await this.processURL()

      window.Arbolado.emitEvent(this, 'arbolado:map/loaded')

      // Initialize Geo button
      const geoBtn = document.querySelector('[js-map-geo-btn]') as GeoBtn
      geoBtn.addEventListener('arbolado:geo/searching', () => window.Arbolado.setLoading(true))
      geoBtn.addEventListener('arbolado:geo/error', () => window.Arbolado.setLoading(false))
      geoBtn.addEventListener('arbolado:geo/success', (event) => {
        const { lat, lng } = (event as CustomEvent).detail
        this.setMarker([lng, lat])
        window.Arbolado.setLoading(false)
      })
    })
  }

  public setMarker(center: [number, number], radius: number = this.MARKER_RADIUS) {
    this.marker?.set(center, radius)
  }

  public removeMarker() {
    this.marker?.remove()
  }

  public displayTrees(trees: Tree[]) {
    this.trees?.displayTrees(trees)
  }

  public displayTree(tree: Tree) {
    if (!this.trees?.hasTrees()) this.displayTrees([tree])
  }

  public selectTree(id: string): void {
    // Emit the selected tree's ID
    window.Arbolado.emitEvent(this, 'arbolado:tree/selected', { id })
  }

  private async processURL() {
    const path = window.location.pathname.split('/')
    if (path[1] === 'ubicacion') {
      const ubicacion = path[2]
      if (ubicacion) {
        const results = await window.Arbolado.addressLookup(ubicacion)
        if (results[0]) {
          const { lat, lng } = results[0].latlng
          this.setMarker([lng, lat])
        }
      }
    }

    const markerParam = window.Arbolado.queryParams.get('user_latlng')
    const radiusParam = window.Arbolado.queryParams.get('radio')
    if (markerParam) {
      const parts = markerParam.split(' ')
      try {
        const lat = Number(parts[0])
        const lng = Number(parts[1])
        if (isNaN(lat) || isNaN(lng)) throw new Error('Invalid coordinates')
        const radius = Number(radiusParam)
        this.setMarker([lng, lat], isNaN(radius) ? undefined : radius)
      } catch {
        window.Arbolado.queryParams.delete('user_latlng')
        window.Arbolado.pushQueryParams()
      }
    }
  }
}