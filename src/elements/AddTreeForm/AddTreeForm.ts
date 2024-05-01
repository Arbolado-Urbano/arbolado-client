import AddTreeFormTemplate from './AddTreeForm.html?raw'
import SpeciesImageTemplate from './SpeciesImage.html?raw'

import SpeciesSelect from '../SpeciesSelect/SpeciesSelect'
import Captcha from '../Captcha'
import GeoInput from '../GeoInput/GeoInput'
import PlantNetResponse from '../../types/PlantNetResponse'

declare type ImageType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto'

export default class AddTreeForm extends HTMLElement {
  private step: number = 0
  private steps: NodeListOf<HTMLFormElement>
  private nextBtn: HTMLButtonElement
  private prevBtn: HTMLButtonElement
  private submitBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private cancelBtn: HTMLButtonElement
  private resetBtn: HTMLButtonElement
  private progress: { wrapper: HTMLElement, bar: HTMLElement }
  private identifyBtn: HTMLButtonElement
  private speciesSelect: SpeciesSelect
  private speciesManualWrapper: HTMLElement
  private speciesManualInput: HTMLInputElement
  private geoInput: GeoInput
  private captchaWidget: Captcha
  private imagesInput: HTMLInputElement
  private speciesImages: HTMLUListElement
  private selectedImages: { image: File, type: ImageType }[] = []
  private selectedSpecies?: string
  private autoSpecies: boolean = true
  private speciesAutoInput: HTMLInputElement
  private speciesAutoError: HTMLDivElement

  constructor() {
    super()
    this.innerHTML = AddTreeFormTemplate
    this.reset = this.reset.bind(this)
    this.submit = this.submit.bind(this)
    this.identifySpecies = this.identifySpecies.bind(this)
    this.processSpeciesImages = this.processSpeciesImages.bind(this)
    
    this.captchaWidget = document.querySelector('[js-captcha-widget]') as Captcha
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
    this.imagesInput = this.querySelector('[name="images[]"]') as HTMLInputElement
    this.speciesAutoInput = this.querySelector('[js-auto-species-input]') as HTMLInputElement
    this.speciesAutoError = this.querySelector('[js-auto-species-error]') as HTMLDivElement
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
    this.querySelector('[js-tab="auto"]')?.addEventListener('arbolado:tab/open', () => {
      this.imagesInput.setAttribute('required', 'true')
      this.speciesSelect.removeAttribute('required')
      this.autoSpecies = true
    })
    this.querySelector('[js-tab="auto"]')?.addEventListener('arbolado:tab/close', () => {
      this.imagesInput.removeAttribute('required')
      this.speciesSelect.setAttribute('required', 'true')
      this.autoSpecies = false
    })

    this.imagesInput.addEventListener('change', this.processSpeciesImages)

    this.submitBtn.addEventListener('click', () => this.submit())
  }

  private goStep(index: number) {
    if ((index >= this.steps.length) || (index < 0)) return
    if ((index > this.step) && (!this.isValidCurrentStep())) return
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
    const stepForm = this.steps[this.step]
    stepForm.classList.add('was-validated')
    if (this.step === 1) {
      if (this.geoInput.value !== null) {
        this.geoInput.classList.remove('is-invalid')
        return true
      } else {
        this.geoInput.classList.add('is-invalid')
        this.geoInput.addEventListener('change', () => this.geoInput.classList.remove('is-invalid'), { once: true })
        return false
      }
    } else if (this.step === 2) {
      if (!this.autoSpecies) {
        if (!this.speciesSelect.value) {
          this.speciesSelect.classList.add('is-invalid')
          this.speciesSelect.addEventListener('change', () => this.speciesSelect.classList.remove('is-invalid'), { once: true })
          return false
        } else {
          this.speciesSelect.classList.remove('is-invalid')
          if (this.speciesSelect.value.id === -1) {
            return !!this.speciesManualInput.value
          }
          return true
        }
      }
    }
    return stepForm.checkValidity()
  }

  private reset() {
    this.prevBtn.classList.remove('d-none')
    this.nextBtn.classList.remove('d-none')
    this.cancelBtn.classList.remove('d-none')
    this.closeBtn.classList.add('d-none')
    this.resetBtn.classList.add('d-none')
    this.steps.forEach((step, index) => {
      step.classList.remove('was-validated')
      if (index === 0) { return }
      step.reset()
    })
    this.goStep(0)
  }

  private processSpeciesImages() {
    // Remove the is-invalid class for the image input when an image is selected in case it's there
    if (this.imagesInput.value) this.imagesInput.classList.remove('is-invalid')
    const imageFiles = this.imagesInput.files
    if (!imageFiles) return
    for (let index = 0; index < imageFiles.length; index++) {
      if (this.selectedImages.length >= 5) break
      const imageFile = imageFiles[index]
      this.selectedImages.push({ image: imageFile, type: 'auto' })
    }
    this.imagesInput.value = ''
    if (this.selectedImages.length >= 5) {
      this.querySelector('[js-species-image-btn]')?.setAttribute('disabled', 'disabled')
      this.querySelector('[js-species-image-btn]')?.classList.add('disabled')
      this.imagesInput.setAttribute('disabled', 'disabled')
    }
    this.renderSpeciesImages()
  }

  private renderSpeciesImages() {
    this.speciesImages.innerHTML = ''
    for (let index = 0; index < this.selectedImages.length; index++) {
      const selectedImage = this.selectedImages[index]
      const imageFile = selectedImage.image
      const speciesImageWrapper = window.Arbolado.loadTemplate(SpeciesImageTemplate) as HTMLLIElement
      const speciesImage = speciesImageWrapper.querySelector('[js-species-image]') as HTMLImageElement
      speciesImage.src = URL.createObjectURL(imageFile)
      speciesImageWrapper.querySelector(`[id="image-type-${selectedImage.type}"]`)?.setAttribute('checked', 'checked')
      for (const type of ['leaf', 'flower', 'fruit', 'bark', 'auto']) {
        const imageTypeInput = speciesImageWrapper.querySelector(`[id="image-type-${type}"]`)
        imageTypeInput?.setAttribute('name', `image-type-${index}`)
        imageTypeInput?.setAttribute('id', `image-type-${type}-${index}`)
        speciesImageWrapper.querySelector(`[for="image-type-${type}"]`)?.setAttribute('for', `image-type-${type}-${index}`)
        speciesImageWrapper.querySelectorAll('input').forEach((typeInput) => typeInput.addEventListener('change', () => {
          const selectedType = document.querySelector(`[name="image-type-${index}"]:checked`) as HTMLInputElement
          selectedImage.type = selectedType.value as ImageType
        }))
      }
      speciesImageWrapper.querySelector('[js-remove]')?.addEventListener('click', () => {
        this.selectedImages.splice(index, 1)
        this.querySelector('[js-species-image-btn]')?.removeAttribute('disabled')
        this.querySelector('[js-species-image-btn]')?.classList.remove('disabled')
        this.imagesInput.removeAttribute('disabled')
        this.renderSpeciesImages()
      })
      this.speciesImages.append(speciesImageWrapper)
    }
  }

  private async identifySpecies() {
    this.speciesAutoError.classList.remove('d-block')
    if (!this.selectedImages.length) {
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
    for (const selectedImage of this.selectedImages) {
      data.append('images[]', selectedImage.image)
      data.append('types[]', selectedImage.type)
    }
    // Add captcha token to data
    data.set('captcha', token)
    const response = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/identificar`, 'POST', data) as PlantNetResponse
    if (response) {
      const bestMatchSpecies = response.results[0]?.species
      this.selectedSpecies = bestMatchSpecies.scientificNameWithoutAuthor
      this.speciesAutoInput.value = `${bestMatchSpecies?.scientificName} (${bestMatchSpecies?.commonNames.join(', ')})`
    } else {
      this.speciesAutoError.classList.add('d-block')
    }
  }

  private async submit() {
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

    // Species is used in case of automatic or manual input
    let species: string | undefined = undefined
    // SpeciesId is used in case of a selection from the species dropdown
    let speciesId: number | undefined = undefined
    if (this.autoSpecies) {
      species = this.selectedSpecies || ""
    } else if (this.speciesSelect.value?.id === -1) {
      species = this.speciesManualInput.value
    } else {
      speciesId = this.speciesSelect.value?.id
    }

    const step0FormData = new FormData(this.steps[0])
    const step3FormData = new FormData(this.steps[3])

    const data = JSON.stringify({
      email: step0FormData.get("email"),
      name: step0FormData.get("name"),
      website: step0FormData.get("website"),
      coordinates: this.geoInput.value,
      species,
      speciesId,
      height: step3FormData.get("height"),
      inclination: step3FormData.get("inclination"),
      diameterTrunk: step3FormData.get("diameter-trunk"),
      diameterCanopy: step3FormData.get("diameter-canopy"),
      development: step3FormData.get("development"),
      health: step3FormData.get("health"),
      captcha: token,
    })

    // Make the search
    let requestUrl = `${import.meta.env.VITE_API_URL}/arboles`
    const response = await window.Arbolado.fetch(requestUrl, "POST", data)
    if (response?.status == 200) {
      this.goStep(this.step + 1)
    } else {
      alert('Ocurrió un error, intentá de nuevo más tarde')
    }
  }
}
