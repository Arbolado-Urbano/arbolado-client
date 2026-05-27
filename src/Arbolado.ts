import { NominatimSearchResult } from './types/NominatimResponse'
import { TreeList } from './types/Tree'

import Alert, { AlertType } from './elements/Alert/Alert'

type EventDetail<T> = T extends CustomEvent<infer D> ? D : T extends Event ? void : never

type OptionalArg<D> = D extends void ? [] : [data: D]

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
      this.emitEvent(document, 'arbolado:queryParams/update')
    })
    this.overlay.addEventListener('click', () => this.emitEvent(document, 'arbolado:overlay/click'))
  }

  ready(fn: () => any) {
    document.addEventListener('DOMContentLoaded', fn)
  }

  loadTemplate(HTMLContent: string): Node {
    const template = document.createElement('template')
    template.innerHTML = HTMLContent
    return template.content.cloneNode(true)
  }

  emitEvent<T extends keyof HTMLElementEventMap>(element: Node, name: T, ...data: OptionalArg<EventDetail<HTMLElementEventMap[T]>>) {
    element.dispatchEvent(new CustomEvent(name, { detail: data[0] }))
  }

  setLoading(loading: boolean) {
    this.emitEvent(document, 'arbolado:loading', { loading })
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
      throw error
    } finally {
      if (loadingIndicator) this.setLoading(false)
    }
  }

  async fetchAPI(path: string, method: string = 'GET', body?: BodyInit, headers: Headers = new Headers(), loadingIndicator: boolean = true) {
    headers.append('Accept', 'application/json')
    return await this.fetch(`${import.meta.env.VITE_API_URL}${path}`, method, body, headers, loadingIndicator)
  }

  alert(type: AlertType, content: string, timeout?: number) {
    const alert = new Alert(type, content)
    alert.addEventListener('arbolado:alert/closed', () => alert.remove())
    document.body.append(alert)
    alert.show(timeout)
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

  async loadSourceFromURL() {
    const path = window.location.pathname.split('/')
    if (path[1] !== 'fuente') return
    const fuenteUrl = path[2]
    if (!fuenteUrl) return
    try {
      const response = await this.fetchAPI(`/fuentes/${fuenteUrl}`, 'GET')
      const trees: TreeList | undefined = await response.json()
      if (!trees?.length) return
      this.emitEvent(document, 'arbolado:results/updated', { trees })
      window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll up to the map (for mobile)
    } catch (error) {
      console.log(error)
    }
  }

  // Looks up an address or place and returns its coordinates.
  async addressLookup(query: string, bounds?: maplibregl.LngLatBounds): Promise<NominatimSearchResult[] | undefined> {
    const { VITE_NOMINATIM_URL } = import.meta.env
    const data = new URLSearchParams({
      'accept-language': 'es',
      addressdetails: '1',
      bounded: '1',
      format: 'json',
      q: query,
    })
    if (bounds) data.set('viewbox', `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    const url = `${VITE_NOMINATIM_URL}?${data.toString()}`
    try {
      const response = await this.fetch(url, 'GET', undefined, { 'Accept': 'application/json' }, false)
      return await response.json()
    } catch (error) {
      console.error(error)
      this.alert('danger', 'Ocurrió un error. Intenta nuevamente más tarde.')
    }
  }
}