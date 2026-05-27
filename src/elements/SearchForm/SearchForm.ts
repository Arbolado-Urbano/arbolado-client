import * as bootstrap from 'bootstrap'

import SearchFormTemplate from './SearchForm.html?raw'

import SpeciesSelect from '../SpeciesSelect/SpeciesSelect'

export default class SearchForm extends HTMLElement {
  private searchBtn: HTMLButtonElement
  private searchBtnPopover: bootstrap.Popover
  private form: HTMLFormElement
  private flavors: HTMLInputElement
  private cuyana: HTMLInputElement
  private nea: HTMLInputElement
  private noa: HTMLInputElement
  private pampeana: HTMLInputElement
  private patagonica: HTMLInputElement
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
    this.cuyana = this.querySelector('[js-input=cuyana]') as HTMLInputElement
    this.nea = this.querySelector('[js-input=nea]') as HTMLInputElement
    this.noa = this.querySelector('[js-input=noa]') as HTMLInputElement
    this.pampeana = this.querySelector('[js-input=pampeana]') as HTMLInputElement
    this.patagonica = this.querySelector('[js-input=patagonica]') as HTMLInputElement
    this.species = this.querySelector('[js-input=species]') as SpeciesSelect
    this.filtersSidebar = new bootstrap.Offcanvas(document.querySelector('[js-filters-menu]') as HTMLElement)
    // Submit handler
    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.search()
    })
    // Set the initial form values when the species have loaded
    if (window.Arbolado.species.length) {
      this.updateFormValues()
    } else {
      document.addEventListener('arbolado:species/loaded', this.updateFormValues)
    }
    // Update the form values if the user navigates back/forth trough the session's history
    document.addEventListener('arbolado:queryParams/update', () => this.updateFormValues())
    // Set the popover for the search button that pops up when the search is too big
    this.searchBtnPopover = new bootstrap.Popover(this.searchBtn, {
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
    if (event.detail.species?.url === 'plantera-vacia') {
      this.flavors.disabled = true
      this.cuyana.disabled = true
      this.nea.disabled = true
      this.noa.disabled = true
      this.pampeana.disabled = true
      this.patagonica.disabled = true
      this.flavors.checked = false
      this.cuyana.checked = false
      this.nea.checked = false
      this.noa.checked = false
      this.pampeana.checked = false
      this.patagonica.checked = false
    } else {
      this.flavors.disabled = false
      this.cuyana.disabled = false
      this.nea.disabled = false
      this.noa.disabled = false
      this.pampeana.disabled = false
      this.patagonica.disabled = false
    }
  }

  private async updateFormValues() {
    // Set the form field values from the URL query parameters if any
    this.flavors.checked = window.Arbolado.queryParams.get('user_sabores') !== null
    this.cuyana.checked = window.Arbolado.queryParams.get('borigen_cuyana') !== null
    this.nea.checked = window.Arbolado.queryParams.get('borigen_nea') !== null
    this.noa.checked = window.Arbolado.queryParams.get('borigen_noa') !== null
    this.pampeana.checked = window.Arbolado.queryParams.get('borigen_pampeana') !== null
    this.patagonica.checked = window.Arbolado.queryParams.get('borigen_patagonica') !== null
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

  public async search(updateURL: boolean = true) {
    // Validate the form
    if (!window.Arbolado.validateForm(this.form)) return

    // Set the URL query params to update the URL
    this.setQueryParam('user_sabores', this.flavors.checked)
    this.setQueryParam('borigen_cuyana', this.cuyana.checked)
    this.setQueryParam('borigen_nea', this.nea.checked)
    this.setQueryParam('borigen_noa', this.noa.checked)
    this.setQueryParam('borigen_pampeana', this.pampeana.checked)
    this.setQueryParam('borigen_patagonica', this.patagonica.checked)

    const searchQueryParams = new URLSearchParams(window.Arbolado.queryParams)

    if (this.species.value?.url) {
      if (updateURL) window.Arbolado.pushURL(`/especie/${this.species.value.url}`)
      searchQueryParams.set('especie_id', this.species.value.url.toString())
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
        borigen_cuyana: this.cuyana.checked,
        borigen_nea: this.nea.checked,
        borigen_noa: this.noa.checked,
        borigen_pampeana: this.pampeana.checked,
        borigen_patagonica: this.patagonica.checked,
      },
    })
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll up to the map (for mobile)
  }
}