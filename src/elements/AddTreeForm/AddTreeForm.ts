import AddTreeFormTemplate from './AddTreeForm.html?raw'
import SpeciesImageTemplate from './SpeciesImage.html?raw'
import ImagePreviewTemplate from './ImagePreview.html?raw'

import SpeciesSelect from '../SpeciesSelect/SpeciesSelect'
import Captcha from '../Captcha'
import GeoInput from '../GeoInput/GeoInput'
import PlantNetResponse from '../../types/PlantNetResponse'
import TabGroup from '../TabGroup'

const STEP_LABELS = ['id', 'location', 'images', 'species', 'data', 'end'] as const
export type StepLabel = typeof STEP_LABELS[number]

declare type ImageType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto'

export default class AddTreeForm extends HTMLElement {
  private step: { index: number, label: string } = { index: 0, label: 'id' }
  private steps: Record<StepLabel, HTMLFormElement>
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
  private emailInput: HTMLInputElement
  private nameInput: HTMLInputElement
  private websiteInput: HTMLInputElement
  private codeInput: HTMLInputElement
  private rememberInput: HTMLInputElement
  private speciesImagesInput: HTMLInputElement
  private speciesImagesPreviews: HTMLUListElement
  private imagesInput: HTMLInputElement
  private imagesPreviews: HTMLUListElement
  private selectedSpeciesImages: { image: File, type: ImageType }[] = []
  private selectedSpecies?: string
  private autoSpecies: boolean = false
  private speciesAutoInput: HTMLInputElement
  private speciesAutoError: HTMLDivElement
  private modal: HTMLElement
  private personalDataTabGroup: TabGroup

  constructor() {
    super()
    this.innerHTML = AddTreeFormTemplate
    this.reset = this.reset.bind(this)
    this.submit = this.submit.bind(this)
    this.identifySpecies = this.identifySpecies.bind(this)
    this.processSpeciesImages = this.processSpeciesImages.bind(this)
    this.goToFirstStep = this.goToFirstStep.bind(this)

    this.captchaWidget = document.querySelector('[js-captcha-widget]') as Captcha
    this.submitBtn = this.querySelector('[js-submit-btn]') as HTMLButtonElement
    this.nextBtn = this.querySelector('[js-next-btn]') as HTMLButtonElement
    this.prevBtn = this.querySelector('[js-prev-btn]') as HTMLButtonElement
    this.cancelBtn = this.querySelector('[js-cancel-btn]') as HTMLButtonElement
    this.closeBtn = this.querySelector('[js-close-btn]') as HTMLButtonElement
    this.resetBtn = this.querySelector('[js-reset-btn]') as HTMLButtonElement
    this.identifyBtn = this.querySelector('[js-identify-btn]') as HTMLButtonElement
    this.geoInput = this.querySelector('[js-geo-input]') as GeoInput
    this.speciesSelect = this.querySelector('[js-input=species]') as SpeciesSelect
    this.speciesManualWrapper = this.querySelector('[js-species-manual]') as HTMLElement
    this.speciesManualInput = this.querySelector('[js-input=species-manual]') as HTMLInputElement
    this.speciesImagesPreviews = this.querySelector('[js-species-images]') as HTMLUListElement
    this.speciesImagesInput = this.querySelector('[js-input="species-images[]"]') as HTMLInputElement
    this.imagesInput = this.querySelector('[js-input="images[]"]') as HTMLInputElement
    this.imagesPreviews = this.querySelector('[js-images]') as HTMLUListElement
    this.emailInput = this.querySelector('[js-input=email]') as HTMLInputElement
    this.nameInput = this.querySelector('[js-input=name]') as HTMLInputElement
    this.websiteInput = this.querySelector('[js-input=website]') as HTMLInputElement
    this.codeInput = this.querySelector('[js-input=code]') as HTMLInputElement
    this.rememberInput = this.querySelector('[js-input=remember]') as HTMLInputElement
    this.speciesAutoInput = this.querySelector('[js-auto-species-input]') as HTMLInputElement
    this.speciesAutoError = this.querySelector('[js-auto-species-error]') as HTMLDivElement
    this.steps = {
      id: this.querySelector('[js-step=id]') as HTMLFormElement,
      data: this.querySelector('[js-step=data]') as HTMLFormElement,
      end: this.querySelector('[js-step=end]') as HTMLFormElement,
      images: this.querySelector('[js-step=images]') as HTMLFormElement,
      location: this.querySelector('[js-step=location]') as HTMLFormElement,
      species: this.querySelector('[js-step=species]') as HTMLFormElement,
    }
    this.progress = { wrapper: this.querySelector('[js-progress]') as HTMLElement, bar: this.querySelector('[js-progress-bar]') as HTMLElement }
    this.personalDataTabGroup = this.querySelector("[js-tabgroup=personal-data]") as TabGroup
    this.modal = this.querySelector('[js-modal]') as HTMLElement

    this.nextBtn.addEventListener('click', () => this.goStep(this.step.index + 1))
    this.prevBtn.addEventListener('click', () => this.goStep(this.step.index - 1))
    this.resetBtn.addEventListener('click', this.reset)
    this.identifyBtn.addEventListener('click', this.identifySpecies)

    // Display the manual species text input when no speices is selected on the species selection dropdown
    this.speciesSelect.addEventListener('arbolado:species/change', (event) => {
      if (event.detail.species?.id === -1) {
        this.speciesManualInput.setAttribute('required', 'true')
        this.speciesManualWrapper.classList.remove('d-none')
      } else {
        this.speciesManualInput.removeAttribute('required')
        this.speciesManualWrapper.classList.add('d-none')
      }
    })

    // Alternate between automatic and manual speceies selection inputs
    this.querySelector('[js-tab=auto]')?.addEventListener('arbolado:tab/open', () => {
      this.speciesImagesInput.setAttribute('required', 'true')
      this.speciesSelect.removeAttribute('required')
      this.autoSpecies = true
    })
    this.querySelector('[js-tab=auto]')?.addEventListener('arbolado:tab/close', () => {
      this.speciesImagesInput.removeAttribute('required')
      this.speciesSelect.setAttribute('required', 'true')
      this.autoSpecies = false
    })

    // Alternate between email and code inputs
    this.querySelector('[js-tab=email]')?.addEventListener('arbolado:tab/open', () => {
      this.emailInput.setAttribute('required', 'true')
      this.nameInput.setAttribute('required', 'true')
      this.codeInput.removeAttribute('required')
    })
    this.querySelector('[js-tab=code]')?.addEventListener('arbolado:tab/open', () => {
      this.emailInput.removeAttribute('required')
      this.nameInput.removeAttribute('required')
      this.codeInput.setAttribute('required', 'true')
    })

    this.speciesImagesInput.addEventListener('change', this.processSpeciesImages)
    this.imagesInput.addEventListener('change', () => this.previewImages(this.imagesInput.files))

    this.submitBtn.addEventListener('click', () => this.submit())

    // Skip first step if data was saved to localstorage
    this.modal.addEventListener('show.bs.modal', () => { if (this.step.index === 0) this.goToFirstStep() })

    this.addEventListener('arbolado:form/step', (event) => {
      const step = event.detail.label
      if (step === 'location') {
        // Reset the height of the geoInput map, because it's within a modal we need to reset it for it to display correctly
        this.geoInput.resetHeight()
        // Just in case the modal is still openeing reset the height again after the modal has been shown
        this.modal.addEventListener('shown.bs.modal', () => this.geoInput.resetHeight(), { once: true })
        // Display or hide the block and orientation inputs based on the user's id method
        if (this.personalDataTabGroup.currentTab() === 'code') {
          this.querySelector('[js-input-wrapper=block]')?.classList.remove('d-none')
          this.querySelector('[js-input-wrapper=orientation]')?.classList.remove('d-none')
          this.querySelector('[js-input=block]')?.setAttribute('required', 'true')
          this.querySelector('[js-input=orientation]')?.setAttribute('required', 'true')
          this.geoInput.setCenter(-32.22445134285866, -58.14305122417706) // Center on Colón
        } else {
          this.querySelector('[js-input-wrapper=block]')?.classList.add('d-none')
          this.querySelector('[js-input-wrapper=orientation]')?.classList.add('d-none')
          this.querySelector('[js-input=block]')?.removeAttribute('required')
          this.querySelector('[js-input=orientation]')?.removeAttribute('required')
          this.geoInput.setCenter(-34.618, -58.44) // Center on BsAs
        }
      } else if (step === 'data') {
        // Display or hide the data inputs based on whether the species is the "emtpy planter" or not
        if (this.speciesSelect.value?.url === 'plantera-vacia') {
          this.querySelector('[js-input-wrapper=inclination]')?.classList.add('d-none')
          this.querySelector('[js-input-wrapper=development]')?.classList.add('d-none')
          this.querySelector('[js-input-wrapper=health]')?.classList.add('d-none')
          this.querySelector('[js-input-wrapper=height]')?.classList.add('d-none')
          this.querySelector('[js-input-wrapper=diameter]')?.classList.add('d-none')
        } else {
          this.querySelector('[js-input-wrapper=inclination]')?.classList.remove('d-none')
          this.querySelector('[js-input-wrapper=development]')?.classList.remove('d-none')
          this.querySelector('[js-input-wrapper=health]')?.classList.remove('d-none')
          this.querySelector('[js-input-wrapper=height]')?.classList.remove('d-none')
          this.querySelector('[js-input-wrapper=diameter]')?.classList.remove('d-none')
        }
      }
    })
  }

  private goToFirstStep() {
    const code = localStorage.getItem('code')
    if (code) {
      this.codeInput.value = code
      this.personalDataTabGroup.show('code')
      this.goStep(1)
      this.rememberInput.checked = true
    } else {
      const email = localStorage.getItem('email')
      const name = localStorage.getItem('name')
      if (email && name) {
        const website = localStorage.getItem('website')
        this.emailInput.value = email
        this.nameInput.value = name
        this.websiteInput.value = website ?? ''
        this.personalDataTabGroup.show('email')
        this.goStep(1)
        this.rememberInput.checked = true
      } else {
        this.goStep(0)
      }
    }
  }

  private goStep(index: number) {
    if ((index >= STEP_LABELS.length) || (index < 0)) return
    if ((index > this.step.index) && (!this.isValidCurrentStep())) return
    if (index === STEP_LABELS.indexOf('images') && this.personalDataTabGroup.currentTab() !== 'code') {
      if (index > this.step.index) index += 1
      else index -= 1
    }
    STEP_LABELS.forEach((stepId) => this.steps[stepId].classList.add('d-none'))
    this.steps[STEP_LABELS[index]]?.classList.remove('d-none')
    if (index > 0) {
      this.prevBtn.classList.remove('d-none')
    } else {
      this.prevBtn.classList.add('d-none')
    }
    if (index === STEP_LABELS.length - 2) {
      this.nextBtn.classList.add('d-none')
      this.submitBtn.classList.remove('d-none')
    } else {
      this.submitBtn.classList.add('d-none')
      if (index === STEP_LABELS.length - 1) {
        this.prevBtn.classList.add('d-none')
        this.cancelBtn.classList.add('d-none')
        this.closeBtn.classList.remove('d-none')
        this.resetBtn.classList.remove('d-none')
      } else {
        this.nextBtn.classList.remove('d-none')
      }
    }
    this.step = { index, label: this.steps[STEP_LABELS[index]].getAttribute('js-step') as StepLabel }
    window.Arbolado.emitEvent(this, 'arbolado:form/step', this.step)
    this.updateProgress()
  }

  private updateProgress() {
    const currentProgress = ((this.step.index / (STEP_LABELS.length - 1)) * 100).toString()
    this.progress.wrapper.setAttribute('aria-valuenow', currentProgress)
    this.progress.bar.style.width = `${currentProgress}%`
  }

  private isValidCurrentStep() {
    const stepForm = this.steps[STEP_LABELS[this.step.index]]
    stepForm.classList.add('was-validated')
    if (this.step.label === "location") {
      if (this.geoInput.value !== null) {
        this.geoInput.classList.remove('is-invalid')
        return stepForm.checkValidity()
      } else {
        this.geoInput.classList.add('is-invalid')
        this.geoInput.addEventListener('change', () => this.geoInput.classList.remove('is-invalid'), { once: true })
        return false
      }
    } else if (this.step.label === "species") {
      if (!this.autoSpecies) {
        if (!this.speciesSelect.value) {
          this.speciesSelect.classList.add('is-invalid')
          this.speciesSelect.addEventListener('arbolado:species/change', () => this.speciesSelect.classList.remove('is-invalid'), { once: true })
          return false
        } else {
          this.speciesSelect.classList.remove('is-invalid')
          if (this.speciesSelect.value.id === -1) {
            return !!this.speciesManualInput.value
          }
          return true
        }
      } else {
        if (this.speciesAutoInput.value === '') {
          this.speciesAutoInput.classList.add('is-invalid')
          return false
        } else {
          this.speciesAutoInput.classList.remove('is-invalid')
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
    this.speciesImagesPreviews.innerHTML = ''
    this.imagesPreviews.innerHTML = ''
    this.selectedSpeciesImages = []
    STEP_LABELS.forEach((stepId, index) => {
      this.steps[stepId].classList.remove('was-validated')
      if (index === 0) { return }
      this.steps[stepId].reset()
    })
    this.goToFirstStep()
  }

  private processSpeciesImages() {
    // Remove the is-invalid class for the image input when an image is selected in case it's there
    if (this.speciesImagesInput.value) this.speciesImagesInput.classList.remove('is-invalid')
    const imageFiles = this.speciesImagesInput.files
    if (!imageFiles) return
    for (let index = 0; index < imageFiles.length; index++) {
      if (this.selectedSpeciesImages.length >= 5) break
      const imageFile = imageFiles[index]
      this.selectedSpeciesImages.push({ image: imageFile, type: 'auto' })
    }
    this.speciesImagesInput.value = ''
    if (this.selectedSpeciesImages.length >= 5) {
      this.querySelector('[js-species-image-btn]')?.setAttribute('disabled', 'disabled')
      this.querySelector('[js-species-image-btn]')?.classList.add('disabled')
      this.speciesImagesInput.setAttribute('disabled', 'disabled')
    }
    this.renderSpeciesImages()
  }

  private renderSpeciesImages() {
    this.speciesImagesPreviews.innerHTML = ''
    for (let index = 0; index < this.selectedSpeciesImages.length; index++) {
      const selectedImage = this.selectedSpeciesImages[index]
      const imageFile = selectedImage.image
      const speciesImageWrapper = window.Arbolado.loadTemplate(SpeciesImageTemplate) as HTMLLIElement
      const speciesImage = speciesImageWrapper.querySelector('[js-species-image]') as HTMLImageElement
      speciesImage.src = URL.createObjectURL(imageFile)
      speciesImageWrapper.querySelector(`[id='image-type-${selectedImage.type}']`)?.setAttribute('checked', 'checked')
      for (const type of ['leaf', 'flower', 'fruit', 'bark', 'auto']) {
        const imageTypeInput = speciesImageWrapper.querySelector(`[id='image-type-${type}']`)
        imageTypeInput?.setAttribute('name', `image-type-${index}`)
        imageTypeInput?.setAttribute('id', `image-type-${type}-${index}`)
        speciesImageWrapper.querySelector(`[for='image-type-${type}']`)?.setAttribute('for', `image-type-${type}-${index}`)
        speciesImageWrapper.querySelectorAll('input').forEach((typeInput) => typeInput.addEventListener('change', () => {
          const selectedType = document.querySelector(`[js-input='image-type-${index}']:checked`) as HTMLInputElement
          selectedImage.type = selectedType.value as ImageType
        }))
      }
      speciesImageWrapper.querySelector('[js-remove]')?.addEventListener('click', () => {
        this.selectedSpeciesImages.splice(index, 1)
        this.querySelector('[js-species-image-btn]')?.removeAttribute('disabled')
        this.querySelector('[js-species-image-btn]')?.classList.remove('disabled')
        this.speciesImagesInput.removeAttribute('disabled')
        this.renderSpeciesImages()
      })
      this.speciesImagesPreviews.append(speciesImageWrapper)
    }
  }

  private previewImages(imageFiles: FileList | null) {
    this.imagesPreviews.innerHTML = ''
    if (!imageFiles) return
    for (const imageFile of imageFiles) {
      const ImageWrapper = window.Arbolado.loadTemplate(ImagePreviewTemplate) as HTMLLIElement
      const image = ImageWrapper.querySelector('[js-image]') as HTMLImageElement
      image.src = URL.createObjectURL(imageFile)
      this.imagesPreviews.append(ImageWrapper)
    }
  }

  private async identifySpecies() {
    this.speciesAutoError.classList.remove('d-block')
    if (!this.selectedSpeciesImages.length) {
      this.speciesImagesInput.classList.add('is-invalid')
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
    for (const selectedImage of this.selectedSpeciesImages) {
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
      this.speciesAutoInput.classList.remove('is-invalid')
    } else {
      this.speciesAutoError.classList.add('d-block')
    }
  }

  private async submit() {
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
      species = this.selectedSpecies || ''
    } else if (this.speciesSelect.value?.id === -1) {
      species = this.speciesManualInput.value
    } else {
      speciesId = this.speciesSelect.value?.id
    }

    const idFormData = new FormData(this.steps.id)
    const locationFormData = new FormData(this.steps.location)
    const dataFormData = new FormData(this.steps.data)

    localStorage.removeItem('code')
    localStorage.removeItem('email')
    localStorage.removeItem('name')
    localStorage.removeItem('website')
    if (idFormData.get('remember') === 'on') {
      if (this.personalDataTabGroup.currentTab() === 'code') {
        if (idFormData.has('code')) localStorage.setItem('code', idFormData.get('code')!.toString())
      } else {
        if (idFormData.has('email')) localStorage.setItem('email', idFormData.get('email')!.toString())
        if (idFormData.has('name')) localStorage.setItem('name', idFormData.get('name')!.toString())
        if (idFormData.has('website')) localStorage.setItem('website', idFormData.get('website')!.toString())
      }
    }

    const data = new FormData()
    if (idFormData.has('code')) data.set('code', idFormData.get('code')!)
    if (idFormData.has('email')) data.set('email', idFormData.get('email')!)
    if (idFormData.has('name')) data.set('name', idFormData.get('name')!)
    if (idFormData.has('website')) data.set('website', idFormData.get('website')!)
    if (locationFormData.has('block')) data.set('block', locationFormData.get('block')!)
    if (locationFormData.has('orientation')) data.set('orientation', locationFormData.get('orientation')!)
    if (this.geoInput.value) data.set('coordinates', this.geoInput.value)
    if (species) data.set('species', species)
    if (speciesId) data.set('speciesId', speciesId.toString())
    if (dataFormData.has('height')) data.set('height', dataFormData.get('height')!)
    if (dataFormData.has('inclination')) data.set('inclination', dataFormData.get('inclination')!)
    if (dataFormData.has('diameter-trunk')) data.set('diameterTrunk', dataFormData.get('diameter-trunk')!)
    if (dataFormData.has('notes')) data.set('notes', dataFormData.get('notes')!)
    if (dataFormData.has('development')) data.set('development', dataFormData.get('development')!)
    if (dataFormData.has('health')) data.set('health', dataFormData.get('health')!)
    data.set('captcha', token)
    for (const image of this.selectedSpeciesImages) {
      data.append("species-images[]", image.image)
    }
    if (this.imagesInput.files) {
      for (const image of this.imagesInput.files) {
        data.append("images[]", image)
      }
    }

    // Submit
    const requestUrl = `${import.meta.env.VITE_API_URL}/${this.personalDataTabGroup.currentTab() === 'code' ? 'arboles' : 'aportes'}`
    const response = await window.Arbolado.fetch(requestUrl, 'POST', data)
    if (response?.status == 200) {
      this.goStep(this.step.index + 1)
    } else {
      alert('Ocurrió un error, intentá de nuevo más tarde')
    }
  }
}
