import Species from '../types/Species'

export default class SpeciesSelect extends HTMLElement {
  private species: Species[] = []
  private status: string = 'idle'
  public value: Species | null = null
  private filtered: Species[] = []
  private btnElement: HTMLButtonElement
  private inputElement: HTMLInputElement
  private listElement: HTMLElement
  private allSpeciesElement: Species = { nombre_cientifico: 'Todas', nombre_comun: '', id: -1, url: '' }

  constructor() {
    super()
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.renderSpecies = this.renderSpecies.bind(this)
    this.addSpeciesOption = this.addSpeciesOption.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.selectSpeciesFromURL = this.selectSpeciesFromURL.bind(this)
    this.loadSpecies = this.loadSpecies.bind(this)

    this.inputElement = this.querySelector('[js-species-select-input]') as HTMLInputElement
    this.listElement = this.querySelector('[js-species-select-list]') as HTMLElement
    this.btnElement = this.querySelector('[js-species-select-btn]') as HTMLButtonElement

    // Load the species list on first interaction
    this.btnElement.addEventListener('click', this.loadSpecies, { once: true })
    // When the dropdown opens focus on the input field
    this.btnElement.addEventListener('shown.bs.dropdown', () => this.inputElement.focus())
    // Filter the list when the user types in the text input
    this.inputElement.addEventListener('input', this.handleInput)
    // Arrow key navigation & enter for selecting a species
    this.addEventListener('keydown', this.handleKeyDown, true)
  }

  setValue(species: Species | null) {
    this.value = species
    this.updateBtnLabel()
    window.Arbolado.emitEvent(this, 'change', { species: this.value })
    this.resetFilter()
  }

  // Load the list of all species from the API
  private async loadSpecies() {
    if (this.status === 'loaded') return
    this.status = 'loading'
    await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/especies`).then((species) => {
      this.renderSpecies([this.allSpeciesElement, ...species])
      this.status = 'loaded'
      window.Arbolado.emitEvent(this, 'arbolado/species:loaded')
    })
  }

  public async setSpeciesFromURL(): Promise<Species | null> {
    return new Promise((resolve) => {
      const path = window.location.pathname.split('/')
      if (path[1] !== 'especie') return resolve(null)
      const speciesURL = path[2]
      if (!speciesURL) return resolve(null)
      if (this.status === 'idle') this.loadSpecies()
      if (this.status === 'loading') {
        this.addEventListener('arbolado/species:loaded', () => resolve(this.selectSpeciesFromURL(speciesURL)))
      } else {
        resolve(this.selectSpeciesFromURL(speciesURL))
      }
    })
  }

  private selectSpeciesFromURL(speciesURL: string) {
    const species = this.species.find((species) => species.url === speciesURL) || null
    this.selectSpecies(species?.id)
    return this.value
  }

  private selectSpecies(id?: number) {
    let species = null
    if (id) species = this.species.find((species) => species.id === id) || null
    this.setValue(species)
  }

  private updateActiveDescendant() {
    let index = this.getFocusedSpecies()
    const query = index !== false ? `[js-species-select-item-btn][data-index="${index}"]` : '[js-species-select-item-btn]'
    const speciesBtn: HTMLButtonElement | null = this.querySelector(query)
    this.inputElement.setAttribute('aria-activeDescendant', speciesBtn?.id || '')
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
    this.filtered = this.species.filter((species) => {
      return (
        species.nombre_comun.toLowerCase().includes(searchTerm) ||
        species.nombre_cientifico.toLowerCase().includes(searchTerm)
      )
    })
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
      commonName.innerText = this.value.nombre_comun
      this.btnElement.appendChild(commonName)
    } else {
      this.btnElement.innerText = this.allSpeciesElement.nombre_cientifico
    }
  }

  private addSpeciesOption(species: Species, index: number) {
    const template = this.querySelector('[js-template="species-select-item"]') as HTMLTemplateElement
    const templateClone = template.content.cloneNode(true) as HTMLElement
    const item = templateClone.querySelector('[js-species-select-item]') as HTMLElement
    const btn = templateClone.querySelector('[js-species-select-item-btn]') as HTMLButtonElement
    const scientificName = btn.querySelector('[js-scientific-name]') as HTMLElement
    const commonName = btn.querySelector('[js-common-name]') as HTMLElement
    item.dataset['index'] = index.toString()
    btn.dataset['index'] = index.toString()
    btn.id = `${this.btnElement.getAttribute('aria-controls')}-${index}`
    scientificName.innerText = species?.nombre_cientifico || ''
    commonName.innerText = species?.nombre_comun || ''
    btn.addEventListener('click', () => this.selectSpecies(species?.id))
    this.listElement.append(templateClone)
  }

  private resetFilter() {
    this.inputElement.value = ''
    this.listElement.innerHTML = ''
    this.renderSpecies(this.species)
  }

  private renderSpecies(species: Species[]) {
    this.species = species
    this.filtered = [...this.species]
    this.filtered.map((species, index) => this.addSpeciesOption(species, index))
  }
}