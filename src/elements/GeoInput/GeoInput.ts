import { Map, Marker } from 'mapbox-gl'

import GeoBtn from '../GeoBtn/GeoBtn'
import AddressLookup from '../AddressLookup/AddressLookup'
import { MapLayerSwitcher } from '../MapLayerSwitcher/MapLayerSwitcher'

import GeoInputTemplate from './GeoInput.html?raw'
import { styles } from '../MapElement/MapElement'

const SOURCE_ID = "trees"
const CLUSTER_LAYER_ID = "clusters"
const CLUSTER_COUNT_LAYER_ID = "cluster-count"
const ICON_LAYER_ID = "icons"
const CLUSTER_MAX_ZOOM = 16

export default class GeoInput extends HTMLElement {
  _value: string | null = null
  private addressLookup: AddressLookup
  private geoBtn: GeoBtn
  private treesToggle: HTMLInputElement
  private map: Map
  private marker?: Marker

  constructor() {
    super()
    this.attachInternals()
    this.innerHTML = GeoInputTemplate

    this.geoBtn = this.querySelector('[js-geo-btn]') as GeoBtn
    this.addressLookup = this.querySelector('[js-address-lookup]') as AddressLookup
    this.treesToggle = this.querySelector('[js-trees-toggle]') as HTMLInputElement

    this.map = new Map({
      container: 'geo-input-map',
      center: [-58.44, -34.618], // BsAs
      zoom: 14,
      maxZoom: 21,
      minZoom: 5,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      style: styles.streets,
      language: "es-419",
    })

    this.treesToggle.addEventListener('change', this.toggleTrees)

    this.geoBtn.addEventListener('arbolado:geo/searching', () => this.setLoading(true))
    this.geoBtn.addEventListener('arbolado:geo/error', () => this.setLoading(false))
    this.geoBtn.addEventListener('arbolado:geo/success', ({ detail }) => {
      this.setLoading(false)
      this.setValue(detail)
    })

    this.map.on('click', ({ lngLat }) => {
      this.setValue(lngLat)
    })

    this.map.on('move', () => {
      const bounds = this.map.getBounds()
      if (bounds) this.addressLookup.setBounds(bounds)
    })

    this.map.on("style.load", async () => {
      if (this.treesToggle.checked) {
        await this.toggleTrees()
      }
    })

    // Layer switcher
    this.map.addControl(new MapLayerSwitcher('streets'), 'bottom-right')

    this.addressLookup.addEventListener('arbolado:address/selected', ({ detail }) => this.setValue(detail))
  }

  formResetCallback = () => {
    this.setValue()
  }

  toggleTrees = async () => {
    if (!this.map.getSource(SOURCE_ID)) {
      await window.Arbolado.dataSource.loadTrees(this.map, SOURCE_ID, CLUSTER_MAX_ZOOM)
    }
    if (this.treesToggle.checked) {
      await window.Arbolado.dataSource.addLayers(this.map, SOURCE_ID, CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, ICON_LAYER_ID)
    } else {
      this.map.removeLayer(CLUSTER_COUNT_LAYER_ID)
      this.map.removeLayer(CLUSTER_LAYER_ID)
      this.map.removeLayer(ICON_LAYER_ID)
    }
  }

  setCenter = (lat: number, lng: number) => {
    this.map.panTo({ lat, lng })
  }

  resize = () => {
    this.map.resize()
  }

  static get formAssociated() { return true }
  get value() { return this._value }
  set value(value) {
    this._value = value
    window.Arbolado.emitEvent(this, 'change')
  }

  /**
  * Sets the given latLng as the current value and sets a marker on the map for those coordinates
  * 
  * @param latLng - Latitude and longitude coordinates
  */
  private setValue = (latLng?: { lat: number, lng: number }) => {
    if (!latLng) {
      if (this.marker) this.marker.remove()
      this.value = null
    } else {
      // If there's no marker on the map...
      if (!this.marker) {
        // Create a new marker
        this.marker = new Marker({ draggable: true }).setLngLat([latLng.lng, latLng.lat])
      } else {
        // If a marker already exists, move it
        this.marker.setLngLat([latLng.lng, latLng.lat])
      }
      this.marker.addTo(this.map)
      // Update the selected coordinates
      this.latlngUpdated(latLng)
      // Set the value for the selected coordinates
      this.value = `${latLng.lat},${latLng.lng}`
    }
  }

  private setLoading = (loading: boolean) => {
    if (loading) this.classList.add('loading')
    else this.classList.remove('loading')
  }

  /**
   * Re-centers the map around the given coordinates
   * 
   * @param map - The map object
   * @param latLng - The latlng coordinates
   */
  private latlngUpdated(latLng: { lat: number, lng: number }) {
    // Re-center the map around the given coordinates
    this.map?.panTo(latLng)
    // Set the new coordinates
  }
}