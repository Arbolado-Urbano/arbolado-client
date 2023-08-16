export default class Arbolado {
  overlay: HTMLElement 
  queryParams: URLSearchParams
  callOnEsc: Function[] = []
  bodyScrollHide: number = 0
  
  constructor() {
    this.overlay = document.querySelector('[js-overlay]') as HTMLElement
    this.queryParams = new URLSearchParams(window.location.search)
    document.addEventListener('keydown', this.handleEsc.bind(this))
    window.addEventListener('popstate', () => {
      this.queryParams = new URLSearchParams(window.location.search)
      this.emitEvent(document, 'arbolado/queryParams:update')
    })
    this.overlay.addEventListener('click', () => this.emitEvent(document, 'arbolado/overlay:click'))
  }

  ready(fn: () => any) {
    document.addEventListener('DOMContentLoaded', fn)
  }

  emitEvent(element: Node, name: string, data?: any) {
    element.dispatchEvent(new CustomEvent(name, { detail: data }))
  }

  setLoading(loading: boolean) {
    this.emitEvent(document, 'arbolado/loading', { loading })
  }

  pushURL(path: string) {
    let queryParams = ''
    if (this.queryParams.toString()) queryParams = `?${this.queryParams.toString()}`
    const url = `${window.location.protocol}//${window.location.host}${path}${queryParams}`
    history.pushState(null, '', url)
  }

  pushQueryParams() {
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${this.queryParams.toString()}`
    history.pushState(null, '', url)
  }

  async fetch(url: string, method: string = 'GET', body?: BodyInit, headers?: HeadersInit, loadingIndicator: boolean = true) {
    if (loadingIndicator) this.setLoading(true)
    try {
      return await fetch(url, { method, headers, body })
    } catch (error) {
      console.error(error)
    } finally {
      if (loadingIndicator) this.setLoading(false)
    }
  }

  async fetchJson(url: string, method: string = 'GET', body?: BodyInit, contentType?: string, loadingIndicator: boolean = true) {
    const headers: HeadersInit = { 'Accept': 'application/json' }
    if (contentType) headers['Content-type'] = contentType
    try {
      const response = await this.fetch(url, method, body, headers, loadingIndicator)
      return await response?.json()
    } catch (error) {
      console.error(error)
    }
  }

  validateForm(form: HTMLFormElement): boolean {
    const inputs = form.elements
    for (const input of inputs) {
      const inputElement = input as HTMLInputElement
      if (!inputElement.checkValidity()) {
        form.classList.add('was-validated')
        inputElement.focus()
        return false
      }
    }
    return true
  }

  toggleOverlay(show: boolean) {
    if (show) this.overlay.classList.add('show')
    else this.overlay.classList.remove('show')
  }

  handleEsc(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    this.callOnEsc.pop()?.()
  }

  callOnEscPush(f: Function) { this.callOnEsc.push(f) }
  callOnEscRemove(f: Function) {
    const index = this.callOnEsc.indexOf(f)
    if (index === -1) return
    this.callOnEsc.splice(index, 1)
  }

  hideBodyScroll() {
    this.bodyScrollHide++
    document.body.classList.add('disable-scroll')
  }

  showBodyScroll() {
    this.bodyScrollHide--
    if (this.bodyScrollHide < 0) this.bodyScrollHide = 0
    if (this.bodyScrollHide === 0) {
      document.body.classList.remove('disable-scroll')
    }
  }
}