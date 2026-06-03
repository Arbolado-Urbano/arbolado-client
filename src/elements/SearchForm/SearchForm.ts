import { Offcanvas, Popover } from 'bootstrap'

import SearchFormTemplate from './SearchForm.html?raw'

import { EMPTY_PLANTER_URL } from '../../constants/emptyPlanter'

import SpeciesSelect from '../SpeciesSelect/SpeciesSelect'

export default class SearchForm extends HTMLElement {
  private searchBtn: HTMLButtonElement
  private searchBtnPopover: Popover
  private form: HTMLFormElement
  private flavors: HTMLInputElement
  private species: SpeciesSelect
  private filtersSidebar: bootstrap.Offcanvas

  constructor() {
    super()
    this.innerHTML = SearchFormTemplate
    this.handleSpeciesChange = this.handleSpeciesChange.bind(this)
    // Init form fields
    this.form = this.querySelector('[js-form]') as HTMLFormElement
    this.searchBtn = this.querySelector('[js-search-btn]') as HTMLButtonElement
    this.flavors = this.querySelector('[js-input=flavors]') as HTMLInputElement
    this.species = this.querySelector('[js-input=species]') as SpeciesSelect
    this.filtersSidebar = new Offcanvas(document.querySelector('[js-filters-menu]') as HTMLElement)
    // Submit handler
    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.search()
    })
    // Set the initial form values when the species have loaded
    if (window.Arbolado.species !== undefined) {
      this.updateFormValues()
    } else {
      document.addEventListener('arbolado:species/loaded', () => this.updateFormValues())
    }
    // Update the form values if the user navigates back/forth trough the session's history
    document.addEventListener('arbolado:queryParams/update', () => this.updateFormValues())
    // Set the popover for the search button that pops up when the search is too big
    this.searchBtnPopover = new Popover(this.searchBtn, {
      title: 'Opa, ¡esos son muchos árboles!',
      content: '<p>Para buscar, empezá marcando un punto en el mapa.</p><p><em>Consejo piola: Podés buscar en toda la ciudad si seleccionás alguna especie.<em></p>',
      trigger: 'focus',
      html: true,
    })
    this.searchBtnPopover.disable()
    // Disable all filters if empty planter has been selected
    this.species.addEventListener('arbolado:species/change', this.handleSpeciesChange)
  }

  private handleSpeciesChange(event: HTMLElementEventMap['arbolado:species/change']) {
    if (event.detail.species?.url === EMPTY_PLANTER_URL) {
      this.flavors.disabled = true
      this.flavors.checked = false
    } else {
      this.flavors.disabled = false
    }
  }

  private async updateFormValues() {
    // Set the form field values from the URL query parameters if any
    this.flavors.checked = window.Arbolado.queryParams.get('user_sabores') !== null
    this.species.setSpeciesFromURL()
    this.search(false)
  }

  // If checked => the query param "name" will be set with the value "value", otherwise the param will be deleted
  private setQueryParam(name: string, checked: boolean, value: string = '1') {
    if (checked) {
      window.Arbolado.queryParams.set(name, value)
    } else {
      window.Arbolado.queryParams.delete(name)
    }
  }

  private async search(updateURL: boolean = true) {
    // Validate the form
    if (!window.Arbolado.validateForm(this.form)) return

    // Set the URL query params to update the URL
    if (updateURL) this.setQueryParam('user_sabores', this.flavors.checked)

    if (this.species.value?.url) {
      if (updateURL) window.Arbolado.pushURL(`/especie/${this.species.value.url}`)
    } else {
      if (updateURL) window.Arbolado.pushURL('')
    }

    // Close the filters sidebar
    this.filtersSidebar.hide()

    // Make the search
    window.Arbolado.emitEvent(this, 'arbolado:search', {
      filters: {
        url: this.species.value?.url,
        user_sabores: this.flavors.checked,
      },
    })
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll up to the map (for mobile)
  }
}