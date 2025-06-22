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
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      alert('El acceso a tu ubicación está desactivado. Por favor activalo en la configuración de tu navegador')
    } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
      alert('Error al acceder a tu ubicación. Por favor intenta nuevamente o selecciona manualmente')
    } else if (err.code === GeolocationPositionError.TIMEOUT) {
      alert('Error al acceder a tu ubicación. Por favor intenta nuevamente o selecciona manualmente')
    } else {
      alert('No es posible determinar su ubicación. Por favor seleccione manualmente')
    }
    window.Arbolado.emitEvent(this, 'arbolado:geo/error', { error: err })
  }

  handleSuccess: PositionCallback = (pos) => {
    const { coords } = pos
    window.Arbolado.emitEvent(this, 'arbolado:geo/success', { lat: coords.latitude, lng: coords.longitude })
  }

  handleClick() {
    window.Arbolado.emitEvent(this, 'arbolado:geo/searching')
    if (window.ios) { // If we're running inside the iOS app wrapper:
      // Subscribe to the event that will return the user's location or an error from the iOS app
      document.addEventListener("arbolado:ios/location", (event) => {
        const { detail } = event as CustomEvent
        if (detail.error) {
          // Error === 1 means the user has just denied us access to their location. No error message needed.
          if (detail.error === '2') {
            // Error === 2 => means the app has no location access permissions.
            alert('El acceso a tu ubicación está desactivado. Por favor activalo en Configuración -> Apps -> Arbolado Urbano -> Ubicación')
          } else if (detail.error === '3') {
            // Error === 3 => Unknown error.
            alert('Error al acceder a tu ubicación. Por favor intenta nuevamente o selecciona manualmente')
          }
          window.Arbolado.emitEvent(this, 'arbolado:geo/error', { error: detail.error })
        } else {
          this.handleSuccess(detail)
        }
      }, { once: true })
      // Call the provided method to get the user's location
      window.ios.getCurrentPosition()
    } else {
      // If we're not inside the iOS app call the browser's native method to get the user's location
      this.getPosition().then(this.handleSuccess).catch(this.handleError)
    }
  }
}