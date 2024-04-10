import * as bootstrap from 'bootstrap'

import Arbolado from './Arbolado'

import Loader from './elements/Loader/Loader'
import MapElement from './elements/MapElement/MapElement'
import SearchForm from './elements/SearchForm/SearchForm'
import TreeDrawer from './elements/TreeDrawer/TreeDrawer'
import SpeciesSelect from './elements/SpeciesSelect/SpeciesSelect'
import AddressLookup from './elements/AddressLookup/AddressLookup'
import GoogleAds from './elements/GoogleAds'
import GeoInput from './elements/GeoInput/GeoInput'
import AddTreeForm from './elements/AddTreeForm/AddTreeForm'
import Captcha from './elements/Captcha'
import Alert from './elements/Alert/Alert'
import TabGroup from './elements/TabGroup'

declare global {
  interface Window {
    Arbolado: Arbolado,
    adsbygoogle: any,
    grecaptcha: ReCaptchaV2.ReCaptcha,
  }
}

window.Arbolado = new Arbolado()

// Define custom elements
customElements.define('arbolado-loader', Loader)
customElements.define('arbolado-map', MapElement)
customElements.define('arbolado-species-select', SpeciesSelect)
customElements.define('arbolado-form', SearchForm)
customElements.define('arbolado-tree-drawer', TreeDrawer)
customElements.define('arbolado-address-lookup', AddressLookup)
customElements.define('arbolado-google-ads', GoogleAds)
customElements.define('arbolado-geo-input', GeoInput)
customElements.define('arbolado-add-tree-form', AddTreeForm)
customElements.define('arbolado-captcha', Captcha)
customElements.define('arbolado-alert', Alert)
customElements.define('arbolado-tab-group', TabGroup)

window.Arbolado.ready(async () => {
  const searchForm = document.querySelector('[js-arbolado-form]') as SearchForm
  const mapElement = document.querySelector('[js-arbolado-map]') as MapElement
  const treeDrawer = document.querySelector('[js-tree-drawer]') as TreeDrawer
  document.addEventListener('arbolado:results/updated', (event) => mapElement.displayTrees((event as CustomEvent).detail.trees))
  searchForm.addEventListener('arbolado:marker/remove', () => mapElement.removeMarker())
  mapElement.addEventListener('arbolado:maker/set', (event) => searchForm.setMarker((event as CustomEvent).detail.latLng))
  mapElement.addEventListener('arbolado:tree/selected', (event) => treeDrawer.displayTree((event as CustomEvent).detail.id))
  mapElement.addEventListener('arbolado:marker/removed', () => searchForm.removeMarker())
  mapElement.addEventListener('arbolado:marker/search', () => searchForm.search())
  treeDrawer.addEventListener('arbolado:tree/displayed', (event) => mapElement.displayTree((event as CustomEvent).detail.tree))

  // Init Bootstrap's tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element))
  // Init Bootstrap's popovers
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(element => new bootstrap.Popover(element))

  // Check to see if a source is selected on the URL
  await window.Arbolado.loadSourceFromURL()
})
