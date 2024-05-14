import { LatLngBounds } from 'leaflet'

import AddressLookupTemplate from './AddressLookup.html?raw'

import NominatimResponse from '../../types/NominatimResponse'

export default class AddressLookup extends HTMLElement {
  private loadingElement: HTMLElement
  private searchBtn: HTMLButtonElement
  private inputElement: HTMLInputElement
  private resultsElement: HTMLElement
  private itemTemplate: HTMLTemplateElement
  private bounds?: LatLngBounds
  
  constructor() {
    super()

    this.innerHTML = AddressLookupTemplate
    this.loadingElement = this.querySelector('[js-address-lookup-loading]') as HTMLElement
    this.searchBtn = this.querySelector('[js-address-lookup-btn]') as HTMLButtonElement
    this.inputElement = this.querySelector('[js-address-lookup-input]') as HTMLInputElement
    this.resultsElement = this.querySelector('[js-address-lookup-results]') as HTMLElement
    this.itemTemplate = this.querySelector('[js-template="address-lookup-item"]') as HTMLTemplateElement

    this.inputElement.addEventListener('keydown', (event: KeyboardEvent) => this.handleKeydown(event))
    this.searchBtn.addEventListener('click', () => this.handleSearch())
  }

  public setBounds(bounds: LatLngBounds) {
    this.bounds = bounds
  }

  private toggleLoading(loading: boolean) {
    if (loading) {
      this.loadingElement.classList.remove('d-none')
      this.searchBtn.classList.add('d-none')
    } else {
      this.loadingElement.classList.add('d-none')
      this.searchBtn.classList.remove('d-none')
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter') || (event.key === 'NumpadEnter')) {
      event.preventDefault()
      this.handleSearch()
    }
  }

  private async handleSearch() {
    this.toggleLoading(true)
    // Search withing the map bounds
    const results = await window.Arbolado.addressLookup(this.inputElement.value, this.bounds)
    // Load the search results
    if (results.length) {
      this.resultsElement.classList.remove('d-none')
      this.loadResults(results)
    } else {
      this.resultsElement.classList.add('d-none')
    }
    this.toggleLoading(false)
  }

  private loadResults(results: NominatimResponse[]) {
    this.resultsElement.innerHTML = ''
    for (const result of results) {
      const templateClone = this.itemTemplate.content.cloneNode(true) as HTMLElement
      const btn = templateClone.querySelector('[js-address-lookup-item-btn]') as HTMLButtonElement
      btn.innerText = result.displayName
      btn.addEventListener('click', () => this.selectAddress(result))
      this.resultsElement.appendChild(templateClone)
    }
  }

  private selectAddress(address: NominatimResponse) {
    window.Arbolado.emitEvent(this, 'arbolado:address/selected', { latLng: address.latlng })
    // this.mapElement.setMarker(address.latlng)
    this.inputElement.value = address.displayName
    this.resultsElement.classList.add('d-none')
  }
}