import SpeciesSelect from './SpeciesSelect'
import Captcha from './Captcha'
import GeoInput from './GeoInput'

export default class AddTreeForm extends HTMLElement {
  private step: number = 0
  private steps: NodeListOf<Element>
  private nextBtn: HTMLButtonElement
  private prevBtn: HTMLButtonElement
  private submitBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private cancelBtn: HTMLButtonElement
  private resetBtn: HTMLButtonElement
  private progress: { wrapper: HTMLElement, bar: HTMLElement }
  private form: HTMLFormElement
  private identifyBtn: HTMLButtonElement
  private speciesSelect: SpeciesSelect
  private speciesManualWrapper: HTMLElement
  private speciesManualInput: HTMLInputElement
  private geoInput: GeoInput
  private captchaWidget: Captcha
  private imagesInput: HTMLInputElement
  private speciesImages: HTMLUListElement
  private speciesImageTemplate: HTMLTemplateElement
  private selectedImages: File[] = []

  constructor() {
    super()
    this.reset = this.reset.bind(this)
    this.submit = this.submit.bind(this)
    this.identifySpecies = this.identifySpecies.bind(this)
    this.processSpeciesImages = this.processSpeciesImages.bind(this)
    
    this.captchaWidget = document.querySelector('[js-captcha-widget]') as Captcha
    this.form = this.querySelector('[js-tree-form]') as HTMLFormElement
    this.submitBtn = this.querySelector('[js-submit-btn]') as HTMLButtonElement
    this.nextBtn = this.querySelector('[js-next-btn]') as HTMLButtonElement
    this.prevBtn = this.querySelector('[js-prev-btn]') as HTMLButtonElement
    this.cancelBtn = this.querySelector('[js-cancel-btn]') as HTMLButtonElement
    this.closeBtn = this.querySelector('[js-close-btn]') as HTMLButtonElement
    this.resetBtn = this.querySelector('[js-reset-btn]') as HTMLButtonElement
    this.identifyBtn = this.querySelector('[js-identify-btn]') as HTMLButtonElement
    this.geoInput = this.querySelector('[js-geo-input]') as GeoInput
    this.speciesSelect = this.querySelector('[js-input="species"]') as SpeciesSelect
    this.speciesManualWrapper = this.querySelector('[js-species-manual]') as HTMLElement
    this.speciesManualInput = this.querySelector('[name="species-manual"]') as HTMLInputElement
    this.speciesImages = this.querySelector('[js-species-images]') as HTMLUListElement
    this.speciesImageTemplate = this.querySelector('[js-template="species-image"]') as HTMLTemplateElement
    this.imagesInput = this.querySelector('[name="images[]"]') as HTMLInputElement
    this.steps = this.querySelectorAll('[js-step]')
    this.progress = { wrapper: this.querySelector('[js-progress]') as HTMLElement, bar: this.querySelector('[js-progress-bar]') as HTMLElement}

    this.nextBtn.addEventListener('click', () => this.goStep(this.step + 1))
    this.prevBtn.addEventListener('click', () => this.goStep(this.step - 1))
    this.resetBtn.addEventListener('click', this.reset)
    this.identifyBtn.addEventListener('click', this.identifySpecies)

    // Display the manual species text input when no speices is selected on the species selection dropdown
    this.speciesSelect.addEventListener('change', () => {
      if (this.speciesSelect.value?.id === -1) {
        this.speciesManualInput.setAttribute('required', 'true')
        this.speciesManualWrapper.classList.remove('d-none')
      } else {
        this.speciesManualInput.removeAttribute('required')
        this.speciesManualWrapper.classList.add('d-none')
      }
    }) 
    
    // Alternate between automatic and manual speceies selection inputs
    this.querySelector('[js-tab="auto"]')?.addEventListener('arbolado:tab/open', () => this.imagesInput.setAttribute('required', 'true'))
    this.querySelector('[js-tab="auto"]')?.addEventListener('arbolado:tab/close', () => this.imagesInput.removeAttribute('required'))

    this.imagesInput.addEventListener('change', this.processSpeciesImages)

    // Submit handler
    this.form.addEventListener('submit', this.submit)
  }

  private goStep(index: number) {
    if ((index >= this.steps.length) || (index < 0) || (!this.isValidCurrentStep())) return
    this.step = index
    this.steps.forEach((step) => step.classList.add('d-none'))
    this.steps[this.step]?.classList.remove('d-none')
    if (index > 0)  {
      this.prevBtn.classList.remove('d-none')
    } else {
      this.prevBtn.classList.add('d-none')
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
    // Reset the height of the geoInput map just in case we're at that step
    // Because it's within a modal we need to reset it for it to display correctly
    this.geoInput.resetHeight()
  }

  private updateProgress() {
    const currentProgress = ((this.step / (this.steps.length - 1)) * 100).toString()
    this.progress.wrapper.setAttribute('aria-valuenow', currentProgress)
    this.progress.bar.style.width = `${currentProgress}%`
  }

  private isValidCurrentStep() {
    return true
  }

  private reset() {
    this.prevBtn.classList.remove('d-none')
    this.nextBtn.classList.remove('d-none')
    this.cancelBtn.classList.remove('d-none')
    this.closeBtn.classList.add('d-none')
    this.resetBtn.classList.add('d-none')
    this.goStep(0)
  }

  private processSpeciesImages() {
    // Remove the is-invalid class for the image input when an image is selected in case it's there
    if (this.imagesInput.value) this.imagesInput.classList.remove('is-invalid')
    const imageFiles = this.imagesInput.files
    if (!imageFiles) return
    for (let index = 0; index < imageFiles.length; index++) {
      const imageFile = imageFiles[index]
      this.selectedImages.push(imageFile)
    }
    this.imagesInput.value = ''
    this.renderSpeciesImages()
  }

  private renderSpeciesImages() {
    this.speciesImages.innerHTML = ''
    for (let index = 0; index < this.selectedImages.length; index++) {
      const imageFile = this.selectedImages[index]
      const speciesImageWrapper = this.speciesImageTemplate.content.cloneNode(true) as HTMLLIElement
      const speciesImage = speciesImageWrapper.querySelector('[js-species-image]') as HTMLImageElement
      speciesImage.src = URL.createObjectURL(imageFile)
      for (const type of ['leaf', 'flower', 'fruit', 'bark', 'auto']) {
        const imageTypeInput = speciesImageWrapper.querySelector(`[id="image-type-${type}"]`)
        imageTypeInput?.setAttribute('name', `image-type-${index}`)
        imageTypeInput?.setAttribute('id', `image-type-${type}-${index}`)
        speciesImageWrapper.querySelector(`[for="image-type-${type}"]`)?.setAttribute('for', `image-type-${type}-${index}`)
      }
      speciesImageWrapper.querySelector('[js-remove]')?.addEventListener('click', () => {
        this.selectedImages.splice(index, 1)
        this.renderSpeciesImages()
      })
      this.speciesImages.append(speciesImageWrapper)
    }
  }

  private async identifySpecies() {
    // TODO: Check to see if there are selected images
    if (!this.imagesInput.value) {
      this.imagesInput.classList.add('is-invalid')
      return
    }
    let token
    try {
      token = await this.captchaWidget.execute()
    } catch (error) {
      window.Arbolado.alert('danger', 'Ocurrió un error. Intente nuevamente más tarde.')
      console.error(error)
    }
    if (!token) return
    const data = new FormData()
    data.set('images[]', this.imagesInput.value)
    // Add captcha token to data
    data.set('captcha', token)
    const response = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/identificar`, 'POST', data)
    console.log(response)
  }

  private async submit(event: SubmitEvent) {
    event.preventDefault()
    // Validate the form
    // if (!window.Arbolado.validateForm(this.form)) return
    let token
    try {
      token = await this.captchaWidget.execute()
    } catch (error) {
      window.Arbolado.alert('danger', 'Ocurrió un error. Intente nuevamente más tarde.')
      console.error(error)
    }
    if (!token) return

    // Get the form's data
    const data = new FormData(this.form)
    // Add captcha token to data
    data.set('captcha', token)

    // // Make the search
    // let requestUrl = `${import.meta.env.VITE_API_URL}/arboles`
    // const response = await window.Arbolado.fetchJson(requestUrl)
    // TODO: Response handling
  }
}
