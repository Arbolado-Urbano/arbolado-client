import * as bootstrap from 'bootstrap'
import { LatLng } from 'leaflet'

import SpeciesSelect from './SpeciesSelect'

export default class SearchForm extends HTMLElement {
  private latLng?: LatLng
  private noResultsModal: bootstrap.Modal
  private searchBtn: HTMLButtonElement
  private searchBtnPopover: bootstrap.Popover
  private form: HTMLFormElement
  private flavors: HTMLInputElement
  private markerAll: HTMLInputElement
  private markerPoint: HTMLInputElement
  private originNative: HTMLInputElement
  private originExotic: HTMLInputElement
  private cuyana: HTMLInputElement
  private nea: HTMLInputElement
  private noa: HTMLInputElement
  private pampeana: HTMLInputElement
  private patagonica: HTMLInputElement
  private species: SpeciesSelect
  private radio: HTMLInputElement
  private clearOriginBtn: HTMLButtonElement
  
  constructor() {
    super()
    this.noResultsModal = new bootstrap.Modal(document.querySelector('[js-no-results-modal]') as HTMLElement)
    // Init form fields
    this.form = this.querySelector('[js-form]') as HTMLFormElement
    this.searchBtn = this.querySelector('[js-search-btn]') as HTMLButtonElement
    this.radio = this.querySelector('[js-input="radio"]') as HTMLInputElement
    this.flavors = this.querySelector('[js-input="flavors"]') as HTMLInputElement
    this.markerAll = this.querySelector('[js-input="marker-all"]') as HTMLInputElement
    this.markerPoint = this.querySelector('[js-input="marker-point"]') as HTMLInputElement
    this.originNative = this.querySelector('[js-input="origin-native"]') as HTMLInputElement
    this.originExotic = this.querySelector('[js-input="origin-exotic"]') as HTMLInputElement
    this.cuyana = this.querySelector('[js-input="cuyana"]') as HTMLInputElement
    this.nea = this.querySelector('[js-input="nea"]') as HTMLInputElement
    this.noa = this.querySelector('[js-input="noa"]') as HTMLInputElement
    this.pampeana = this.querySelector('[js-input="pampeana"]') as HTMLInputElement
    this.patagonica = this.querySelector('[js-input="patagonica"]') as HTMLInputElement
    this.species = this.querySelector('[js-input="species"]') as SpeciesSelect
    // Clear origin button
    this.clearOriginBtn = this.querySelector('[js-clear-origin]') as HTMLButtonElement
    this.clearOriginBtn.addEventListener('click', () => this.clearOrigin())
    // When an origin is selected display the clear origin button
    this.originNative.addEventListener('change', () => this.clearOriginBtn.classList.remove('d-none'))
    this.originExotic.addEventListener('change', () => this.clearOriginBtn.classList.remove('d-none'))
    // Emit an event when the user selects "En todo el mapa" so the map can be notified and removes the marker
    this.markerAll.addEventListener('change', () => window.Arbolado.emitEvent(this, 'arbolado/marker:remove'))
    // Submit handler
    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.search()
    })
    // Set the initial form values
    this.updateFormValues()
    // Update the form values if the user navigates back/forth trough the session's history
    document.addEventListener('arbolado/queryParams:update', () => this.updateFormValues())
    // Set the popover for the search button that pops up when the search is too big
    this.searchBtnPopover = new bootstrap.Popover(this.searchBtn, {
      title: 'Opa, ¡esos son muchos árboles!',
      content: '<p>Para buscar, empezá marcando un punto en el mapa.</p><p><em>Consejo piola: Podés buscar en toda la ciudad si seleccionás alguna especie.<em></p>',
      trigger: 'focus',
      html: true,
    })
    this.searchBtnPopover.disable()
  }

  private async updateFormValues() {
    // Set the form field values from the URL query parameters if any
    this.flavors.checked = window.Arbolado.queryParams.get('user_sabores') !== null
    this.markerAll.checked = window.Arbolado.queryParams.get('user_latlng') === null
    this.markerPoint.checked = window.Arbolado.queryParams.get('user_latlng') !== null
    this.originNative.checked = window.Arbolado.queryParams.get('user_origen') === 'Nativo/Autóctono'
    this.originExotic.checked = window.Arbolado.queryParams.get('user_origen') === 'Exótico'
    this.cuyana.checked = window.Arbolado.queryParams.get('borigen_cuyana') !== null
    this.nea.checked = window.Arbolado.queryParams.get('borigen_nea') !== null
    this.noa.checked = window.Arbolado.queryParams.get('borigen_noa') !== null
    this.pampeana.checked = window.Arbolado.queryParams.get('borigen_pampeana') !== null
    this.patagonica.checked = window.Arbolado.queryParams.get('borigen_patagonica') !== null

    const latLng = window.Arbolado.queryParams.get('user_latlng')
    if (latLng) {
      try {
        const [lat, lng] = latLng.split(' ').map(Number)
        this.setMarker(new LatLng(lat, lng))
      } catch {
        // Remove the "user_latlng" query param if it's invalid
        window.Arbolado.queryParams.delete('user_latlng')
        window.Arbolado.pushQueryParams()
      }
    }

    // Check if there's a species selected on the URL
    const species = await this.species.loadSpeciesFromURL()

    // If we have coordinates or a species selected on the URL perform the search
    if ((this.latLng) || (species)) this.search(false)
  }

  private getLatLngString() {
    if (!this.latLng) return ''
    else return `${this.latLng.lat} ${this.latLng.lng}`
  }

  private clearOrigin() {
    this.originNative.checked = false
    this.originExotic.checked = false
    this.clearOriginBtn.classList.add('d-none')
  }

  // If checked => the query param "name" will be set with the value "value", otherwise the param will be deleted
  private setQueryParam(name: string, checked: boolean, value: string = '') {
    if (checked) {
      window.Arbolado.queryParams.set(name, value)
    } else {
      window.Arbolado.queryParams.delete(name)
    }
  }

  public async search(updateURL: boolean = true) {
    // Validate the form
    if (!window.Arbolado.validateForm(this.form)) return

    // Get the form's data
    const data = new FormData(this.form)

    // Check if a marker has been placed in the map
    if (this.markerPoint.checked) {
      data.set('marker', this.getLatLngString())
    } else if (!this.species.value) {
      // If there's no marker and no species selected don't search
      // Show the popover for the search button that pops up when the search is too big
      this.searchBtnPopover.enable()
      this.searchBtnPopover.show()
      this.searchBtnPopover.disable()
      return
    }

    // Set the URL query params to update the URL
    this.setQueryParam('user_sabores', this.flavors.checked)
    this.setQueryParam('user_latlng', this.markerPoint.checked, this.getLatLngString())
    this.setQueryParam('borigen_cuyana', this.cuyana.checked)
    this.setQueryParam('borigen_nea', this.nea.checked)
    this.setQueryParam('borigen_noa', this.noa.checked)
    this.setQueryParam('borigen_pampeana', this.pampeana.checked)
    this.setQueryParam('borigen_patagonica', this.patagonica.checked)
    this.setQueryParam('user_origen', this.originExotic.checked, this.originExotic.value)
    this.setQueryParam('user_origen', this.originNative.checked, this.originNative.value)
    if (this.markerPoint.checked) window.Arbolado.queryParams.set('radio', this.radio.value)
    
    const searchQueryParams = new URLSearchParams(window.Arbolado.queryParams)
    
    if (this.species.value?.url) {
      if (updateURL) window.Arbolado.pushURL(`/especie/${this.species.value.url}`)
      searchQueryParams.set('especie_id', this.species.value.id.toString())
    } else {
      if (updateURL) window.Arbolado.pushURL('')
    }

    // Make the search
    let requestUrl = `${import.meta.env.VITE_API_URL}/arboles?${searchQueryParams.toString()}`
    const trees = await window.Arbolado.fetchJson(requestUrl)
    window.Arbolado.emitEvent(this, 'arbolado/results:updated', { trees })
    if (!trees?.length) this.noResultsModal.show()
  }

  public setMarker(latLng: LatLng) {
    this.markerAll.checked = false
    this.markerPoint.checked = true
    this.latLng = latLng
  }

  public removeMarker() {
    this.markerAll.checked = true
    this.markerPoint.checked = false
    this.latLng = undefined
  }
}