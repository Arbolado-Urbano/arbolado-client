import * as bootstrap from 'bootstrap'

import { ArboladoEventMap } from './types/Events'

import Arbolado from './Arbolado'

import Loader from './elements/Loader/Loader'
import MapElement from './elements/MapElement/MapElement'
import SearchForm from './elements/SearchForm/SearchForm'
import TreeDrawer from './elements/TreeDrawer/TreeDrawer'
import SpeciesSelect from './elements/SpeciesSelect/SpeciesSelect'
import AddressLookup from './elements/AddressLookup/AddressLookup'
import GeoInput from './elements/GeoInput/GeoInput'
import AddTreeForm from './elements/AddTreeForm/AddTreeForm'
import Captcha from './elements/Captcha'
import Alert from './elements/Alert/Alert'
import TabGroup from './elements/TabGroup'
import GeoBtn from './elements/GeoBtn/GeoBtn'

declare global {
  interface Window {
    Arbolado: Arbolado,
    turnstile: Turnstile.Turnstile,
    ios?: { getCurrentPosition: () => void }
  }
  interface HTMLElementEventMap extends ArboladoEventMap { }
  interface DocumentEventMap extends ArboladoEventMap { }
}

window.Arbolado = new Arbolado()

// Define custom elements
customElements.define('arbolado-loader', Loader)
customElements.define('arbolado-map', MapElement)
customElements.define('arbolado-species-select', SpeciesSelect)
customElements.define('arbolado-geo-input', GeoInput)
customElements.define('arbolado-add-tree-form', AddTreeForm)
customElements.define('arbolado-captcha', Captcha)
customElements.define('arbolado-alert', Alert)
customElements.define('arbolado-tab-group', TabGroup)

window.Arbolado.ready(async () => {
  const searchForm = document.querySelector('[js-arbolado-form]') as SearchForm
  const mapElement = document.querySelector('[js-arbolado-map]') as MapElement
  const treeDrawer = document.querySelector('[js-tree-drawer]') as TreeDrawer
  const addressLookup = document.querySelector('[js-address-lookup]') as AddressLookup
  document.addEventListener('arbolado:results/updated', (event) => mapElement.displayTrees(event.detail.trees))
  mapElement.addEventListener('arbolado:map/loaded', () => {
    mapElement.addEventListener('arbolado:marker/set', (event) => searchForm.setMarker(event.detail))
    mapElement.addEventListener('arbolado:tree/selected', (event) => treeDrawer.displayTree(event.detail.id))
    mapElement.addEventListener('arbolado:marker/search', () => searchForm.search())
    mapElement.addEventListener('arbolado:map/move', (event) => addressLookup.setBounds(event.detail.bounds))
    treeDrawer.addEventListener('arbolado:tree/displayed', (event) => mapElement.displayTree(event.detail.tree))
    mapElement.addEventListener('arbolado:marker/removed', () => searchForm.removeMarker())
    searchForm.addEventListener('arbolado:marker/remove', () => mapElement.removeMarker())
    addressLookup.addEventListener('arbolado:address/selected', (event) => mapElement.setMarker([event.detail.lng, event.detail.lat]))
    // Wait for the map to be fully loaded before initializing these components
    customElements.define('arbolado-tree-drawer', TreeDrawer)
    customElements.define('arbolado-address-lookup', AddressLookup)
    customElements.define('arbolado-geo-btn', GeoBtn)
    customElements.define('arbolado-form', SearchForm)
  })

  // Init Bootstrap's tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element))
  // Init Bootstrap's popovers
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(element => new bootstrap.Popover(element))

  // Check to see if a source is selected on the URL
  await window.Arbolado.loadSourceFromURL()

  // Check if the privacy policy modal should be displayed
  if ((new URLSearchParams(window.location.search)).has("privacidad")) {
    const privacyModalElement = document.querySelector("#privacy-modal")
    if (privacyModalElement) {
      new bootstrap.Modal(privacyModalElement).show()
    }
  }

  // Check if the instructions modal should be displayed
  if ((new URLSearchParams(window.location.search)).has("ayuda")) {
    const instructionsModalElement = document.querySelector("#instructions-modal")
    if (instructionsModalElement) {
      new bootstrap.Modal(instructionsModalElement).show()
    }
  }

  // Show donations button if we're not inside the iOS app
  if (!window.ios) {
    document.querySelector('[js-donaciones]')?.classList.remove('d-none')
  }
})
