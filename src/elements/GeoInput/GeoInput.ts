import GeoInputTemplate from './GeoInput.html?raw'
import GeoBtn from '../GeoBtn/GeoBtn'

import * as L from 'leaflet'
import AddressLookup from '../AddressLookup/AddressLookup'

const { VITE_MAPBOX_TOKEN: accessToken } = import.meta.env

export default class GeoInput extends HTMLElement {
  _internals: ElementInternals
  _value: string | null = null
  private addressLookup: AddressLookup
  private geoBtn: GeoBtn
  private map?: L.Map // Map reference
  private marker?: L.Marker // Marker
  private mapOptions: L.MapOptions = { // Map options
    dragging: !L.Browser.mobile, // Disable one finger dragging on mobile devices
    center: L.latLng(-34.4720387,-58.5388896), // San Isidro
    layers: [
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          accessToken,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 21
        },
      ),
    ],
    maxZoom: 21,
    minZoom: 5,
    zoom: 14,
  }

  constructor() {
    super()
    this.innerHTML = GeoInputTemplate

    this._internals = this.attachInternals()
    this.geoBtn = this.querySelector('[js-geo-btn]') as GeoBtn
    this.addressLookup = this.querySelector('[js-address-lookup]') as AddressLookup

    this.geoBtn.addEventListener('arbolado:geo/searching', () => this.setLoading(true))
    this.geoBtn.addEventListener('arbolado:geo/error', () => this.setLoading(false))
    this.geoBtn.addEventListener('arbolado:geo/success', (event) => {
      this.setLoading(false)
      const data = (event as CustomEvent).detail
      const latLng = new L.LatLng(data.lat, data.lng)
      this.setValue(latLng)
    })

    this.map = L.map('geo-input-map', this.mapOptions)
    this.map.on('click', (event: any) => {
      this.setValue(event.latlng)
    })
    this.map.on('move', () => this.map && this.addressLookup.setBounds(this.map.getBounds()))
    this.addressLookup.addEventListener('arbolado:address/selected', (event) => this.setValue((event as CustomEvent).detail.latLng))
  }

  static get formAssociated() { return true }
  get form() { return this._internals.form }
  get name() { return this.getAttribute('name') }
  get type() { return this.localName }
  get validity() { return this._internals.validity }
  get validationMessage() { return this._internals.validationMessage }
  get willValidate() { return this._internals.willValidate }
  get value() { return this._value }
  set value(value) {
    this._value = value
    this._internals.setFormValue(this._value)
    this.checkValidity()
    window.Arbolado.emitEvent(this, 'change')
  }
  checkValidity() { return this._internals.checkValidity() }
  reportValidity() { return this._internals.reportValidity() }

  setLoading(loading: boolean) {
    if (loading) this.classList.add('loading')
    else this.classList.remove('loading')
  }

  resetHeight(): void {
    this.map?.invalidateSize()
  }
  
  /**
   * Re-centers the map around the given coordinates
   * @param map - The map object
   * @param latLng - The latlng coordinates
   */
  private latlngUpdated(latLng: L.LatLng): void {
    // Re-center the map around the given coordinates
    this.map?.panTo(latLng)
    // Set the new coordinates
  }
  
  /**
  * Sets the given latLng as the current value and sets a marker on the map for those coordinates
  * @param latLng - Latitude and longitude coordinates
  */
  public setValue(latLng: L.LatLng): void {
    // Get the map object
    if (!this.map) return
    // If there's no marker on the map...
    if (!this.marker) {
      L.Icon.Default.imagePath = '/imgs/markers/'
      // Create a new marker
      this.marker = new L.Marker([latLng.lat, latLng.lng], {
        draggable: true,
        riseOnHover: true,
      })
      this.map.addLayer(this.marker)
    } else {
      // If a marker already exists, move it
      this.marker.setLatLng([latLng.lat, latLng.lng])
    }
    if (!this.map.hasLayer(this.marker)) {
      this.map.addLayer(this.marker)
    }
    // Update the selected coordinates
    this.latlngUpdated(latLng)
    // Set the value for the selected coordinates
    this.value = `${latLng.lat},${latLng.lng}`
  }
}