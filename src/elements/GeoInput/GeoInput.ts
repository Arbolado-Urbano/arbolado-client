import { Map, Marker } from 'maplibre-gl'

import { mapStyles } from '../../constants/mapStyles'

import GeoBtn from '../GeoBtn/GeoBtn'
import AddressLookup from '../AddressLookup/AddressLookup'
import { MapLayerSwitcher } from '../MapLayerSwitcher/MapLayerSwitcher'

import GeoInputTemplate from './GeoInput.html?raw'

export default class GeoInput extends HTMLElement {
  _value: string | null = null
  private addressLookup: AddressLookup
  private geoBtn: GeoBtn
  private map: Map
  private marker?: Marker

  constructor() {
    super()
    this.attachInternals()
    this.innerHTML = GeoInputTemplate

    this.geoBtn = this.querySelector('[js-geo-btn]') as GeoBtn
    this.addressLookup = this.querySelector('[js-address-lookup]') as AddressLookup

    this.map = new Map({
      container: 'geo-input-map',
      style: mapStyles,
      center: [-58.44, -34.618], // BsAs
      zoom: 14,
      maxZoom: 21,
      minZoom: 5,
    })

    this.geoBtn.addEventListener('arbolado:geo/searching', () => this.setLoading(true))
    this.geoBtn.addEventListener('arbolado:geo/error', () => this.setLoading(false))
    this.geoBtn.addEventListener('arbolado:geo/success', ({ detail }) => {
      this.setLoading(false)
      this.setValue(detail)
    })

    this.map.on('click', ({ lngLat }) => {
      this.setValue(lngLat)
    })
    this.map.on('move', () => this.map && this.addressLookup.setBounds(this.map.getBounds()))

    // Layer switcher
    this.map.addControl(new MapLayerSwitcher('streets'), 'bottom-right')

    this.addressLookup.addEventListener('arbolado:address/selected', ({ detail }) => this.setValue(detail))
  }

  formResetCallback() {
    this.setValue()
  }

  setCenter(latitude: number, longitude: number) {
    this.map.panTo({ lat: latitude, lng: longitude }, { zoom: 13 })
  }

  static get formAssociated() { return true }
  get value() { return this._value }
  set value(value) {
    this._value = value
    window.Arbolado.emitEvent(this, 'change')
  }

  setLoading(loading: boolean) {
    if (loading) this.classList.add('loading')
    else this.classList.remove('loading')
  }

  /**
   * Re-centers the map around the given coordinates
   * @param map - The map object
   * @param latLng - The latlng coordinates
   */
  private latlngUpdated(latLng: { lat: number, lng: number }): void {
    // Re-center the map around the given coordinates
    this.map?.panTo(latLng)
    // Set the new coordinates
  }

  /**
  * Sets the given latLng as the current value and sets a marker on the map for those coordinates
  * @param latLng - Latitude and longitude coordinates
  */
  public setValue(latLng?: { lat: number, lng: number }): void {
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
}