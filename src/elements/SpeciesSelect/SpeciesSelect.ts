import SpeciesSelectTemplate from './SpeciesSelect.html?raw'
import SpeciesSelectItemTemplate from './SpeciesSelectItem.html?raw'

import { Species } from '../../types/Species'

import { EMPTY_PLANTER_URL } from '../../constants/emptyPlanter'

export default class SpeciesSelect extends HTMLElement {
  public value: Species | null = null
  private filtered: Species[] = []
  private btnElement: HTMLButtonElement
  private inputElement: HTMLInputElement
  private listElement: HTMLElement
  private noSelectionElement: Species
  private emptyPlanterElement: HTMLInputElement
  private emptyPlanter: Species | undefined
  static formAssociated = true

  constructor() {
    super()
    this.attachInternals()
    this.innerHTML = SpeciesSelectTemplate
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.renderSpecies = this.renderSpecies.bind(this)
    this.addSpeciesOption = this.addSpeciesOption.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.selectSpeciesFromURL = this.selectSpeciesFromURL.bind(this)
    this.handleEmptyPlanterToggle = this.handleEmptyPlanterToggle.bind(this)
    this.resetFilter = this.resetFilter.bind(this)

    this.inputElement = this.querySelector('[js-species-select-input]') as HTMLInputElement
    this.listElement = this.querySelector('[js-species-select-list]') as HTMLElement
    this.btnElement = this.querySelector('[js-species-select-btn]') as HTMLButtonElement
    this.emptyPlanterElement = this.querySelector('[js-input="empty-planter"]') as HTMLInputElement

    // Set IDs
    const emptyPlanterId = `${this.emptyPlanterElement.id}-${this.id}`
    this.querySelector(`[for=${this.emptyPlanterElement.id}]`)?.setAttribute('for', emptyPlanterId)
    this.emptyPlanterElement.id = emptyPlanterId
    this.querySelector('[js-species-dropdown]')!.id += `-${this.id}`

    // Setup the "no species selected" option
    const noSelectionLabel = this.getAttribute('data-no-selection-label') ?? 'Todas'
    this.noSelectionElement = { id: NaN, nombre_cientifico: noSelectionLabel, nombre_comun: '', url: '' }

    // When the dropdown opens focus on the input field
    this.btnElement.addEventListener('shown.bs.dropdown', () => this.inputElement.focus())
    // Filter the list when the user types in the text input
    this.inputElement.addEventListener('input', this.handleInput)
    // Arrow key navigation & enter for selecting a species
    this.addEventListener('keydown', this.handleKeyDown, true)
    // Empty planter selection toggle
    this.emptyPlanterElement.addEventListener('click', this.handleEmptyPlanterToggle)
    // Load the species list when they're loaded
    if (window.Arbolado.species !== undefined) {
      this.resetFilter()
    } else {
      document.addEventListener('arbolado:species/loaded', this.resetFilter)
    }
  }

  formResetCallback() {
    this.handleEmptyPlanterToggle()
  }

  checkValidity() {
    return true
  }

  setValue(species: Species | null) {
    this.value = species
    this.updateBtnLabel()
    window.Arbolado.emitEvent(this, 'arbolado:species/change', { species: this.value })
    this.resetFilter()
  }

  private async handleEmptyPlanterToggle() {
    if (this.emptyPlanterElement.checked) {
      this.btnElement.disabled = true
      this.setValue(this.emptyPlanter ?? null)
    } else {
      this.btnElement.disabled = false
      this.value = null
      this.setValue(null)
      this.btnElement.innerText = 'Seleccionar'
    }
  }

  public setSpeciesFromURL() {
    const path = window.location.pathname.split('/')
    if (path[1] !== 'especie') return null
    const speciesURL = path[2]
    if (!speciesURL) return null
    return this.selectSpeciesFromURL(speciesURL)
  }

  private selectSpeciesFromURL(speciesURL: string) {
    const species = window.Arbolado.species?.find((species) => species.url === speciesURL) ?? null
    this.selectSpecies(species?.url)
    return this.value
  }

  private selectSpecies(url?: string) {
    let species = null
    if (url) species = window.Arbolado.species?.find((species) => species.url === url) ?? null
    this.setValue(species)
  }

  private updateActiveDescendant() {
    let index = this.getFocusedSpecies()
    const query = index !== false ? `[js-species-select-item-btn][data-index="${index}"]` : '[js-species-select-item-btn]'
    const speciesBtn: HTMLButtonElement | null = this.querySelector(query)
    this.inputElement.setAttribute('aria-activeDescendant', speciesBtn?.id ?? '')
  }

  private getFocusedSpecies() {
    const activeSpeciesItem = this.querySelector('[js-species-select-item].active')
    let index
    if (activeSpeciesItem instanceof HTMLElement) {
      index = activeSpeciesItem.dataset['index']
    }
    return index !== undefined ? Number(index) : false
  }

  private setFocusedSpecies(index?: number) {
    const query = index !== undefined ? `[js-species-select-item][data-index="${index}"]` : '[js-species-select-item]'
    const speciesItem: HTMLElement | null = this.querySelector(query)
    const activeSpeciesItem: HTMLElement | null = this.querySelector('[js-species-select-item].active')
    activeSpeciesItem?.classList.remove('active')
    speciesItem?.classList.add('active')
  }

  private handleKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Enter') || (event.key === 'NumpadEnter')) {
      if (this.btnElement.classList.contains('show')) {
        event.preventDefault()
        const focusedIndex = this.getFocusedSpecies()
        if (focusedIndex === false) {
          this.setValue(this.filtered[0])
        } else {
          this.setValue(this.filtered[focusedIndex])
        }
        this.btnElement.click()
      }
    } else if ((event.key === 'ArrowUp') || (event.key === 'ArrowDown')) {
      event.preventDefault()
      const speciesItems = this.querySelectorAll('[js-species-select-item]')
      const focusedIndex = this.getFocusedSpecies()
      if (focusedIndex !== false) {
        let next = focusedIndex + (event.key === 'ArrowUp' ? -1 : 1)
        if (next < 0) next = speciesItems.length - 1
        else if (next >= speciesItems.length) next = 0
        this.setFocusedSpecies(next)
      } else {
        this.setFocusedSpecies()
      }
      this.updateActiveDescendant()
    }
  }

  private handleInput() {
    const searchTerm = this.inputElement.value.toLowerCase()
    this.filtered = window.Arbolado.species?.filter((species) => {
      return (
        species.url !== EMPTY_PLANTER_URL && (
          species.nombre_comun?.toLowerCase().includes(searchTerm) ||
          species.nombre_cientifico.toLowerCase().includes(searchTerm)
        )
      )
    }) ?? []
    this.listElement.innerHTML = ''
    this.filtered.map((species, index) => this.addSpeciesOption(species, index))
  }

  private updateBtnLabel() {
    this.btnElement.innerHTML = ''
    if (this.value) {
      this.btnElement.innerText = this.value.nombre_cientifico
      const commonName = document.createElement('small')
      commonName.classList.add('muted-text')
      commonName.classList.add('ms-1')
      commonName.innerText = this.value.nombre_comun ?? this.value.nombre_cientifico
      this.btnElement.appendChild(commonName)
    } else {
      this.btnElement.innerText = this.noSelectionElement.nombre_cientifico
    }
  }

  private addSpeciesOption(species: Species, index: number) {
    const templateClone = window.Arbolado.loadTemplate(SpeciesSelectItemTemplate) as HTMLElement
    const item = templateClone.querySelector('[js-species-select-item]') as HTMLLIElement
    const btn = templateClone.querySelector('[js-species-select-item-btn]') as HTMLButtonElement
    const scientificName = btn.querySelector('[js-scientific-name]') as HTMLElement
    const commonName = btn.querySelector('[js-common-name]') as HTMLElement
    item.dataset['index'] = index.toString()
    btn.dataset['index'] = index.toString()
    btn.id = `${this.btnElement.getAttribute('aria-controls')}-${index}`
    scientificName.innerText = species?.nombre_cientifico ?? ''
    commonName.innerText = species?.nombre_comun ?? ''
    if (species.url === EMPTY_PLANTER_URL) {
      item.hidden = true
    } else {
      btn.addEventListener('click', () => this.selectSpecies(species?.url))
    }
    this.listElement.append(templateClone)
  }

  private resetFilter() {
    this.inputElement.value = ''
    this.listElement.innerHTML = ''
    this.emptyPlanter = window.Arbolado.species?.find(item => item.url === EMPTY_PLANTER_URL)
    this.renderSpecies([this.noSelectionElement, ...(window.Arbolado.species?.filter(item => item.url !== this.emptyPlanter?.url) ?? [])])
  }

  private renderSpecies(species: Species[]) {
    this.listElement.innerHTML = ''
    this.filtered = [...species]
    this.filtered.forEach((species, index) => this.addSpeciesOption(species, index))
  }
}