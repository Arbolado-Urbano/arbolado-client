import AddTreeFormTemplate from './AddTreeForm.html?raw'
import SpeciesImageTemplate from './SpeciesImage.html?raw'
import ImagePreviewTemplate from './ImagePreview.html?raw'

import { EMPTY_PLANTER_URL } from '../../constants/emptyPlanter'

import SpeciesSelect from '../SpeciesSelect/SpeciesSelect'
import Captcha from '../Captcha'
import GeoInput from '../GeoInput/GeoInput'
import PlantNetResponse from '../../types/PlantNetResponse'
import TabGroup from '../TabGroup'

const STEP_LABELS = ['id', 'location', 'images', 'species', 'data', 'end'] as const
type StepLabel = typeof STEP_LABELS[number]
export type Step = { label: StepLabel, index: number }

declare type ImageType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto'

export default class AddTreeForm extends HTMLElement {
  private static readonly defaultMapCenter = { lat: -34.618, lng: -58.44 } // BsAs
  private step: Step = { index: 0, label: 'id' }
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
  private mapCenter = AddTreeForm.defaultMapCenter
  private censusSlug: string | undefined

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
    this.personalDataTabGroup = this.querySelector('[js-tabgroup=personal-data]') as TabGroup
    this.modal = this.querySelector('[js-modal]') as HTMLElement

    this.nextBtn.addEventListener('click', async () => await this.goStep(this.step.index + 1))
    this.prevBtn.addEventListener('click', async () => await this.goStep(this.step.index - 1))
    this.resetBtn.addEventListener('click', async () => await this.reset())
    this.identifyBtn.addEventListener('click', this.identifySpecies)

    // Display the manual species text input when no speices is selected on the species selection dropdown
    this.speciesSelect.addEventListener('arbolado:species/change', (event) => {
      if (!event.detail.species) {
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

    this.modal.addEventListener('show.bs.modal', async () => { if (this.step.index === 0) await this.goToFirstStep() })

    this.addEventListener('arbolado:form/step', (event) => {
      const stepLabel = event.detail.current.label
      if (stepLabel === 'location') {
        this.querySelector('[js-input-wrapper=block]')?.classList.add('d-none')
        this.querySelector('[js-input-wrapper=street]')?.classList.add('d-none')
        this.querySelector('[js-input-wrapper=street-number]')?.classList.add('d-none')
        this.querySelector('[js-input=block]')?.removeAttribute('required')
        this.querySelector('[js-input=street]')?.removeAttribute('required')
        this.querySelector('[js-input=street-number]')?.removeAttribute('required')
        // Display or hide additional location inputs if the users is a censist
        if (this.personalDataTabGroup.currentTab() === 'code') {
          this.querySelector('[js-input-wrapper=street]')?.classList.remove('d-none')
          this.querySelector('[js-input=street]')?.setAttribute('required', 'true')
          if (this.censusSlug === 'municip-colon') { // Colón
            this.querySelector('[js-input-wrapper=block]')?.classList.remove('d-none')
            this.querySelector('[js-input=block]')?.setAttribute('required', 'true')
          } else if (this.censusSlug === '25demayo') { // 25 de mayo
            this.querySelector('[js-input-wrapper=street-number]')?.classList.remove('d-none')
            this.querySelector('[js-input=street-number]')?.setAttribute('required', 'true')
          }
        }
      } else if (stepLabel === 'data') {
        // Display or hide additional data inputs based on whether the species is the "emtpy planter" or not
        if (this.speciesSelect.value?.url === EMPTY_PLANTER_URL) {
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
      this.geoInput.setCenter(this.mapCenter.lat, this.mapCenter.lng) // Center the map input
    })
  }

  private async goToFirstStep() {
    // Skip first step if data was saved to localstorage
    const code = localStorage.getItem('code')
    if (code) {
      this.codeInput.value = code
      this.personalDataTabGroup.show('code')
      const latlng = localStorage.getItem('latlng')
      if (latlng) {
        const [lat, lng] = latlng.split(',').map(Number)
        this.mapCenter = { lat, lng }
      }
      await this.goStep(1, true)
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
        await this.goStep(1)
        this.rememberInput.checked = true
      } else {
        await this.goStep(0)
      }
    }
  }

  private async goStep(index: number, skipCodeValidation?: boolean) {
    if ((index >= STEP_LABELS.length) || (index < 0)) return
    if ((index > this.step.index) && (!this.isValidCurrentStep())) return
    if (this.step.label === 'id') {
      if (this.personalDataTabGroup.currentTab() === 'code') {
        // If we're moving on from the ID step and the user used a code => validate it
        if (!skipCodeValidation) {
          let token
          try {
            token = await this.captchaWidget.execute()
          } catch (error) {
            console.error(error)
            window.Arbolado.alert('danger', 'Ocurrió un error. Intenta nuevamente más tarde.')
          }
          if (!token) return
          const data = new FormData()
          data.set('captcha', token)
          data.set('code', this.codeInput.value)
          const response = await window.Arbolado.fetchAPI('/usuarios', 'POST', data)
          if (!response.ok) {
            if (response.status === 500) {
              window.Arbolado.alert('danger', 'Ocurrió un error al validar tu código. Intenta nuevamente más tarde.')
            } else {
              window.Arbolado.alert('danger', 'Código inválido. Verifícalo o solicita asistencia.')
              this.codeInput.classList.add('is-invalid')
            }
            return
          }
          try {
            const { lat, lng, slug }: { slug: string, lat: number, lng: number } = await response.json()
            this.censusSlug = slug
            this.mapCenter = { lat, lng }
          } catch (error) {
            console.error(error)
            window.Arbolado.alert('danger', 'Ocurrió un error al validar tu código. Intenta nuevamente más tarde.')
            return
          }
          this.codeInput.classList.remove('is-invalid')
        }
      } else {
        this.mapCenter = AddTreeForm.defaultMapCenter // Restore to default just in case
      }
    }
    // If the user is not a censist then the images step will be skipped
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
    const previous = { ...this.step }
    this.step = { index, label: this.steps[STEP_LABELS[index]].getAttribute('js-step') as StepLabel }
    window.Arbolado.emitEvent(this, 'arbolado:form/step', { current: this.step, previous })
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
    if (this.step.label === 'location') {
      if (this.geoInput.value !== null) {
        this.geoInput.classList.remove('is-invalid')
        return stepForm.checkValidity()
      } else {
        this.geoInput.classList.add('is-invalid')
        this.geoInput.addEventListener('change', () => this.geoInput.classList.remove('is-invalid'), { once: true })
        return false
      }
    } else if (this.step.label === 'species') {
      if (!this.autoSpecies) {
        if (!this.speciesSelect.value) {
          if (!this.speciesManualInput.value) {
            this.speciesSelect.classList.add('is-invalid')
            this.speciesSelect.addEventListener('arbolado:species/change', () => this.speciesSelect.classList.remove('is-invalid'), { once: true })
            return false
          }
        } else {
          this.speciesSelect.classList.remove('is-invalid')
          if (this.speciesSelect.value.url === '') {
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

  private async reset() {
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
    await this.goToFirstStep()
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
      console.error(error)
      window.Arbolado.alert('danger', 'Ocurrió un error. Intenta nuevamente más tarde.')
    }
    if (!token) return
    const data = new FormData()
    for (const selectedImage of this.selectedSpeciesImages) {
      data.append('images[]', selectedImage.image)
      data.append('types[]', selectedImage.type)
    }
    // Add captcha token to data
    data.set('captcha', token)
    try {
      const response = await window.Arbolado.fetchAPI('/identificar', 'POST', data)
      const responseData: PlantNetResponse | undefined = await response.json()
      if (responseData) {
        const bestMatchSpecies = responseData.results[0]?.species
        this.selectedSpecies = bestMatchSpecies.scientificNameWithoutAuthor
        this.speciesAutoInput.value = `${bestMatchSpecies?.scientificName} (${bestMatchSpecies?.commonNames.join(', ')})`
        this.speciesAutoInput.classList.remove('is-invalid')
      } else {
        throw new Error('No JSON response from PlantNet')
      }
    } catch (error) {
      console.error(error)
      this.speciesAutoError.classList.add('d-block')
    }
  }

  private async submit() {
    let token
    try {
      token = await this.captchaWidget.execute()
    } catch (error) {
      console.error(error)
      window.Arbolado.alert('danger', 'Ocurrió un error. Intenta nuevamente más tarde.')
    }
    if (!token) return

    // Species is used in case of automatic or manual input
    let species: string | undefined = undefined
    // SpeciesUrl is used in case of a selection from the species dropdown
    let speciesUrl: string | undefined = undefined
    if (this.autoSpecies) {
      species = this.selectedSpecies ?? ''
    } else if (!this.speciesSelect.value) {
      species = this.speciesManualInput.value
    } else {
      speciesUrl = this.speciesSelect.value.url
    }

    const idFormData = new FormData(this.steps.id)
    const locationFormData = new FormData(this.steps.location)
    const dataFormData = new FormData(this.steps.data)

    localStorage.removeItem('latlng')
    localStorage.removeItem('code')
    localStorage.removeItem('email')
    localStorage.removeItem('name')
    localStorage.removeItem('website')
    if (idFormData.get('remember') === 'on') {
      if (this.personalDataTabGroup.currentTab() === 'code') {
        if (idFormData.has('code')) localStorage.setItem('code', idFormData.get('code')!.toString())
        localStorage.setItem('latlng', `${this.mapCenter.lat},${this.mapCenter.lng}`)
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
    if (locationFormData.has('street')) data.set('street', locationFormData.get('street')!)
    if (locationFormData.has('street-number')) data.set('streetNumber', locationFormData.get('street-number')!)
    if (this.geoInput.value) data.set('coordinates', this.geoInput.value)
    if (species) data.set('species', species)
    if (speciesUrl) data.set('speciesUrl', speciesUrl)
    if (dataFormData.has('height')) data.set('height', dataFormData.get('height')!)
    if (dataFormData.has('inclination')) data.set('inclination', dataFormData.get('inclination')!)
    if (dataFormData.has('diameter-trunk')) data.set('diameterTrunk', dataFormData.get('diameter-trunk')!)
    if (dataFormData.has('notes')) data.set('notes', dataFormData.get('notes')!)
    if (dataFormData.has('development')) data.set('development', dataFormData.get('development')!)
    if (dataFormData.has('health')) data.set('health', dataFormData.get('health')!)
    data.set('captcha', token)
    for (const image of this.selectedSpeciesImages) {
      data.append('species-images[]', image.image)
    }
    if (this.imagesInput.files) {
      for (const image of this.imagesInput.files) {
        data.append('images[]', image)
      }
    }

    // Submit
    const requestUrl = `/${this.personalDataTabGroup.currentTab() === 'code' ? 'arboles' : 'aportes'}`
    const response = await window.Arbolado.fetchAPI(requestUrl, 'POST', data)
    if (!response.ok) {
      alert('Ocurrió un error, intentá de nuevo más tarde')
    } else {
      await this.goStep(this.step.index + 1)
    }
  }
}
