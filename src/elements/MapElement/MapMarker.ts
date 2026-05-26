import { Map, Popup, Marker, GeoJSONSource, LayerSpecification } from 'maplibre-gl'

import MapElement from './MapElement'

import MarkerTemplate from './Marker.html?raw'
import MarkerPopupTemplate from './MarkerPopup.html?raw'

export class MapMarker {
  private readonly CIRCLE_SOURCE = 'radius-circle'
  private parent: MapElement
  private map: Map
  private popup?: Popup
  private marker?: Marker
  private source?: GeoJSONSource
  private layers: LayerSpecification[] = [
    {
      id: 'radius-circle-fill',
      type: 'fill',
      source: this.CIRCLE_SOURCE,
      paint: { 'fill-color': '#5cba9d', 'fill-opacity': .2 },
    },
    {
      id: 'radius-circle-outline',
      type: 'line',
      source: this.CIRCLE_SOURCE,
      paint: { 'line-color': '#5cba9d', 'line-width': 2, 'line-opacity': .8 },
    }
  ]

  constructor(map: Map, parent: MapElement) {
    this.remove = this.remove.bind(this)
    this.map = map
    this.parent = parent
  }

  public set(center: [number, number], radius: number) {
    if (!this.marker) {
      this.create(center, radius)
    } else {
      this.marker.setLngLat(center)
      this.source!.setData(this.createGeoJSONCircle(center, radius))
    }
    // Emit the new marker coordinates
    window.Arbolado.emitEvent(this.parent, 'arbolado:marker/set', { lat: center[1], lng: center[0] })
    // Re-center the map around the marker
    this.map.panTo(center)
    if (!this.popup?.isOpen()) this.marker!.togglePopup()
  }

  public remove() {
    if (this.marker) {
      this.marker.remove()
      this.layers.forEach(layer => this.map.removeLayer(layer.id))
      this.map.removeSource(this.source!.id)
      delete this.marker
      delete this.source
    }
  }

  private getPopup() {
    if (this.popup) return this.popup
    const markerPopupContent = window.Arbolado.loadTemplate(MarkerPopupTemplate) as HTMLElement
    markerPopupContent.querySelector('[js-marker-popup-search]')?.addEventListener('click', () => {
      this.marker?.togglePopup()
      // Emit an event when the user clicks the search button from marker so the search form can be notified and perform the search
      window.Arbolado.emitEvent(this.parent, 'arbolado:marker/search')
    })
    markerPopupContent.querySelector('[js-marker-popup-clear]')?.addEventListener('click', () => {
      this.remove()
      // Emit an event when the user clears the map marker so the search form can be notified and update its UI
      window.Arbolado.emitEvent(this.parent, 'arbolado:marker/removed')
    })
    this.popup = new Popup({ closeButton: false, closeOnClick: false })
    this.popup.setDOMContent(markerPopupContent)
    return this.popup
  }

  private create(center: [number, number], radius: number) {
    const content = window.Arbolado.loadTemplate(MarkerTemplate) as HTMLElement
    const markerElement = content.querySelector('[data-marker=map]') as HTMLElement | null ?? undefined
    this.marker = new Marker({ draggable: true, element: markerElement }).setLngLat(center)
    this.marker.setPopup(this.getPopup())
    // Create a circle around the marker
    this.map.addSource(this.CIRCLE_SOURCE, { type: 'geojson', data: this.createGeoJSONCircle(center, radius) })
    this.layers.forEach(layer => this.map.addLayer(layer))
    this.source = this.map.getSource(this.CIRCLE_SOURCE) as GeoJSONSource
    // When the pin is dragged move the circle to it
    this.marker.on('dragend', () => {
      const pos = this.marker!.getLngLat()
      const center: [number, number] = [pos.lng, pos.lat]
      this.set(center, radius)
    })
    this.marker.on('click', (event) => {
      // Prevent clicks on the marker from setting up a new marker location
      event.originalEvent.stopPropagation()
      this.marker!.togglePopup()
    })
    this.marker.addTo(this.map)
    this.marker.togglePopup()
  }

  private createGeoJSONCircle(center: [number, number], radius: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
    const coords: [number, number][] = []
    const earthRadius = 6371000
    const lat = (center[1] * Math.PI) / 180
    const lng = (center[0] * Math.PI) / 180
    const d = radius / earthRadius
    for (let i = 0; i <= steps; i++) {
      const bearing = (i * 2 * Math.PI) / steps
      const pLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing))
      const pLng = lng + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(pLat))
      coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI])
    }
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {},
    }
  }
}