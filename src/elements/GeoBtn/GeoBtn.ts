import GeoBtnTemplate from './GeoBtn.html?raw'

export default class GeoBtn extends HTMLElement {
  private options: PositionOptions = { enableHighAccuracy: true }
  private btn: HTMLButtonElement

  constructor() {
    super()
    this.innerHTML = GeoBtnTemplate
    this.handleClick = this.handleClick.bind(this)
    this.handleSuccess = this.handleSuccess.bind(this)
    this.handleError = this.handleError.bind(this)

    this.btn = this.querySelector('[js-geo-btn]') as HTMLButtonElement

    this.btn.addEventListener('click', this.handleClick)
  }

  getPosition() {
    return new Promise((resolve: PositionCallback, reject: PositionErrorCallback) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, this.options)
    })
  }

  handleError: PositionErrorCallback = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`)
    alert('No es posible determinar su ubicación. Por favor ingrese manualmente')
    window.Arbolado.emitEvent(this, 'arbolado:geo/error', { error: err })
  }

  handleSuccess: PositionCallback = (pos) => {
    const { coords } = pos
    window.Arbolado.emitEvent(this, 'arbolado:geo/success', { lat: coords.latitude, lng: coords.longitude })
  }

  handleClick() {
    window.Arbolado.emitEvent(this, 'arbolado:geo/searching')
    this.getPosition().then(this.handleSuccess).catch(this.handleError)
  }
}