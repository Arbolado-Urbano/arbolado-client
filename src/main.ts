import * as bootstrap from 'bootstrap'

import Arbolado from './Arbolado'

import Loader from './elements/Loader'
import MapElement from './elements/MapElement'
import SearchForm from './elements/SearchForm'
import TreeDrawer from './elements/TreeDrawer'
import SpeciesSelect from './elements/SpeciesSelect'
import AddresLookup from './elements/AddressLookup'
import GoogleAds from './elements/GoogleAds'
import GeoInput from './elements/GeoInput'

declare global {
  interface Window {
    Arbolado: Arbolado,
    adsbygoogle: any,
  }
}

window.Arbolado = new Arbolado()

// Define custom elements
customElements.define('arbolado-loader', Loader)
customElements.define('arbolado-map', MapElement)
customElements.define('arbolado-species-select', SpeciesSelect)
customElements.define('arbolado-form', SearchForm)
customElements.define('arbolado-tree-drawer', TreeDrawer)
customElements.define('arbolado-address-lookup', AddresLookup)
customElements.define('arbolado-google-ads', GoogleAds)
customElements.define('arbolado-geo-input', GeoInput)

window.Arbolado.ready(async () => {
  const searchForm = document.querySelector('[js-arbolado-form]') as SearchForm
  const mapElement = document.querySelector('[js-arbolado-map]') as MapElement
  const treeDrawer = document.querySelector('[js-tree-drawer]') as TreeDrawer
  document.addEventListener('arbolado/results:updated', (event) => mapElement.displayTrees((event as CustomEvent).detail.trees))
  searchForm.addEventListener('arbolado/marker:remove', () => mapElement.removeMarker())
  mapElement.addEventListener('arbolado/maker:set', (event) => searchForm.setMarker((event as CustomEvent).detail.latLng))
  mapElement.addEventListener('arbolado/tree:selected', (event) => treeDrawer.displayTree((event as CustomEvent).detail.id))
  mapElement.addEventListener('arbolado/marker:removed', () => searchForm.removeMarker())
  mapElement.addEventListener('arbolado/marker:search', () => searchForm.search())
  treeDrawer.addEventListener('arbolado/tree:displayed', (event) => mapElement.displayTree((event as CustomEvent).detail.tree))

  // Init Bootstrap's tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element))
  // Init Bootstrap's popovers
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(element => new bootstrap.Popover(element))

  const geoInput = document.querySelector('[js-geo-input]') as GeoInput | null
  document.querySelector('[js-modal="tree"]')?.addEventListener('shown.bs.modal', () => geoInput?.resetHeight())

  const treeForm = document.querySelector('[js-tree-form]') as HTMLFormElement | null
  treeForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(treeForm)
    const response = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/identificar`, 'POST', data)
    console.log(response)
  })

  // Check to see if a source is selected on the URL
  await window.Arbolado.loadSourceFromURL()
})
