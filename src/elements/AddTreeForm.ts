import { LatLng } from 'leaflet'

import SpeciesSelect from './SpeciesSelect'

export default class AddTreeForm extends HTMLElement {
  private step: number = 0
  private steps: NodeListOf<Element>
  private latLng?: LatLng
  private nextBtn: HTMLButtonElement
  private prevBtn: HTMLButtonElement
  private submitBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private cancelBtn: HTMLButtonElement
  private resetBtn: HTMLButtonElement
  private progress: { wrapper: HTMLElement, bar: HTMLElement }
  private form: HTMLFormElement
  private species: SpeciesSelect

  constructor() {
    super()
    this.reset = this.reset.bind(this)
    
    this.form = this.querySelector('[js-tree-form]') as HTMLFormElement
    this.submitBtn = this.querySelector('[js-submit-btn]') as HTMLButtonElement
    this.nextBtn = this.querySelector('[js-next-btn]') as HTMLButtonElement
    this.prevBtn = this.querySelector('[js-prev-btn]') as HTMLButtonElement
    this.cancelBtn = this.querySelector('[js-cancel-btn]') as HTMLButtonElement
    this.closeBtn = this.querySelector('[js-close-btn]') as HTMLButtonElement
    this.resetBtn = this.querySelector('[js-reset-btn]') as HTMLButtonElement
    this.species = this.querySelector('[js-input="species"]') as SpeciesSelect
    this.steps = this.querySelectorAll('[js-step]')
    this.progress = { wrapper: this.querySelector('[js-progress]') as HTMLElement, bar: this.querySelector('[js-progress-bar]') as HTMLElement}

    this.nextBtn.addEventListener('click', () => this.goStep(this.step + 1))
    this.prevBtn.addEventListener('click', () => this.goStep(this.step - 1))
    this.resetBtn.addEventListener('click', this.reset)

    // Submit handler
    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.submit()
    })
  }

  private goStep(index: number) {
    if ((index >= this.steps.length) || (index < 0) || (!this.isValidCurrentStep())) return
    this.step = index
    this.steps.forEach((step) => step.classList.add('d-none'))
    this.steps[this.step]?.classList.remove('d-none')
    if (index > 0)  {
      this.prevBtn.removeAttribute('disabled')
    } else {
      this.prevBtn.setAttribute('disabled', 'true')
    }
    if (index === this.steps.length - 2) {
      this.nextBtn.classList.add('d-none')
      this.submitBtn.classList.remove('d-none')
    } else {
      this.submitBtn.classList.add('d-none')
      if (index === this.steps.length - 1) {
        this.prevBtn.classList.add('d-none')
        this.cancelBtn.classList.add('d-none')
        this.closeBtn.classList.remove('d-none')
        this.resetBtn.classList.remove('d-none')
      } else {
        this.nextBtn.classList.remove('d-none')
      }
    }
    this.updateProgress()
  }

  private updateProgress() {
    const currentProgress = ((this.step / (this.steps.length - 1)) * 100).toString()
    this.progress.wrapper.setAttribute('aria-valuenow', currentProgress)
    this.progress.bar.style.width = `${currentProgress}%`
  }

  private isValidCurrentStep() {
    return true
  }

  private getLatLngString() {
    if (!this.latLng) return
    else return `${this.latLng.lat} ${this.latLng.lng}`
  }

  private reset() {
    this.prevBtn.classList.remove('d-none')
    this.nextBtn.classList.remove('d-none')
    this.cancelBtn.classList.remove('d-none')
    this.closeBtn.classList.add('d-none')
    this.resetBtn.classList.add('d-none')
    this.goStep(0)
  }

  private async submit() {
    this.goStep(this.step + 1)
    // Validate the form
    // if (!window.Arbolado.validateForm(this.form)) return

    // // Get the form's data
    // const data = new FormData(this.form)

    // // Make the search
    // let requestUrl = `${import.meta.env.VITE_API_URL}/arboles`
    // const response = await window.Arbolado.fetchJson(requestUrl)
    // TODO: Response handling
  }
}
