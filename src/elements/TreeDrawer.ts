import Tree from '../types/Tree'
type TreeData = {
  id: HTMLElement,
  nombre_cientifico: HTMLElement,
  nombre_comun: HTMLElement,
  tipo: HTMLElement,
  familia: HTMLElement,
  origen: HTMLElement,
  procedencia_exotica: HTMLElement,
  regiones: HTMLElement,
  altura: HTMLElement,
  espacio_verde: HTMLElement,
  calle: HTMLElement,
  nombre: HTMLElement,
  fecha_creacion: HTMLElement,
  descripcion: HTMLElement,
  url: HTMLAnchorElement,
  facebook: HTMLAnchorElement,
  instagram: HTMLAnchorElement,
  twitter: HTMLAnchorElement,
  streetview: HTMLIFrameElement,
  link: HTMLAnchorElement,
}
type treeDataKey = keyof TreeData

export default class TreeModal extends HTMLElement {
  private open: boolean = false
  private streetViewUrl: string
  private closeBtn: HTMLButtonElement
  private treeData: TreeData
  private previousUrl?: string
  
  constructor() {
    super()
    this.close = this.close.bind(this)
    this.handleFocusOut = this.handleFocusOut.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    
    const { VITE_GOOGLE_MAPS_STREET_VIEW_URL, VITE_GOOGLE_MAPS_API_KEY } = import.meta.env
    this.streetViewUrl = `${VITE_GOOGLE_MAPS_STREET_VIEW_URL}&key=${VITE_GOOGLE_MAPS_API_KEY}`

    this.closeBtn = this.querySelector('[js-close]') as HTMLButtonElement
    this.closeBtn.addEventListener('click', () => this.close())

    this.treeData = {
      id: this.querySelector('[js-tree-data="id"]') as HTMLElement,
      nombre_cientifico: this.querySelector('[js-tree-data="nombre_cientifico"]') as HTMLElement,
      nombre_comun: this.querySelector('[js-tree-data="nombre_comun"]') as HTMLElement,
      tipo: this.querySelector('[js-tree-data="tipo"]') as HTMLElement,
      familia: this.querySelector('[js-tree-data="familia"]') as HTMLElement,
      origen: this.querySelector('[js-tree-data="origen"]') as HTMLElement,
      procedencia_exotica: this.querySelector('[js-tree-data="procedencia_exotica"]') as HTMLElement,
      regiones: this.querySelector('[js-tree-data="regiones"]') as HTMLElement,
      altura: this.querySelector('[js-tree-data="altura"]') as HTMLElement,
      espacio_verde: this.querySelector('[js-tree-data="espacio_verde"]') as HTMLElement,
      calle: this.querySelector('[js-tree-data="calle"]') as HTMLElement,
      nombre: this.querySelector('[js-tree-data="nombre"]') as HTMLElement,
      fecha_creacion: this.querySelector('[js-tree-data="fecha_creacion"]') as HTMLElement,
      descripcion: this.querySelector('[js-tree-data="descripcion"]') as HTMLElement,
      url: this.querySelector('[js-tree-data="url"]') as HTMLAnchorElement,
      facebook: this.querySelector('[js-tree-data="facebook"]') as HTMLAnchorElement,
      instagram: this.querySelector('[js-tree-data="instagram"]') as HTMLAnchorElement,
      twitter: this.querySelector('[js-tree-data="twitter"]') as HTMLAnchorElement,
      streetview: this.querySelector('[js-tree-data="streetview"]') as HTMLIFrameElement,
      link: this.querySelector('[js-tree-data="link"]') as HTMLAnchorElement,
    }
    this.loadTreeFromURL()
    window.addEventListener('popstate', () => this.loadTreeFromURL())
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('arbolado/overlay:click', () => this.close())
  }

  private setTreeValue(name: treeDataKey, value?: string, attribute?: string) {
    const element = this.treeData[name]
    element.classList.remove('d-none')
    if (value) {
      if (attribute) element.setAttribute(attribute, value)
      else element.innerText = value
    } else {
      element.classList.add('d-none')
    }
  }

  private close(updateURL: boolean = true) {
    this.classList.remove('show')
    window.Arbolado.callOnEscRemove(this.close)
    this.open = false
    window.Arbolado.toggleOverlay(false)
    if (updateURL) {
      if (this.previousUrl) history.pushState(null, '', this.previousUrl)
      else window.Arbolado.pushURL('/')
    }
  }

  private loadTreeFromURL() {
    const path = window.location.pathname.split('/')
    if (path[1] === 'arbol') {
      const treeId = path[2]
      if (treeId) this.displayTree(treeId, false)
    } else {
      this.close(false)
    }
  }

  async displayTree(treeId: string, updateURL: boolean = true) {
    const tree: Tree = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/arboles/${treeId}`)
    // If there's no streetview URL for the tree, use its coordinates
    if (!tree.streetview) {
      tree.streetview = `${this.streetViewUrl}&location=${tree.lat},${tree.lng}`
    }

    const treeLink = `/arbol/${tree.id}`
    
    this.setTreeValue('nombre_cientifico', tree.nombre_cientifico)
    this.setTreeValue('nombre_comun', tree.nombre_comun)
    this.setTreeValue('tipo', tree.tipo)
    this.setTreeValue('familia', tree.familia)
    this.setTreeValue('origen', tree.origen)
    this.setTreeValue('procedencia_exotica', tree.procedencia_exotica)
    this.setTreeValue('regiones', tree.regiones)
    this.setTreeValue('altura', tree.altura)
    this.setTreeValue('espacio_verde', tree.espacio_verde ? `Espacio verde: ${tree.espacio_verde}` : undefined)
    this.setTreeValue('calle', `${tree.calle || ''} ${tree.calle_altura ? tree.calle_altura : 's/n'}`)
    this.setTreeValue('nombre', tree.nombre)
    this.setTreeValue('fecha_creacion', tree.fecha_creacion)
    this.setTreeValue('descripcion', tree.descripcion)
    this.setTreeValue('id', tree.id)
    this.setTreeValue('url', tree.url || '', 'href')
    this.setTreeValue('facebook', tree.facebook || '', 'href')
    this.setTreeValue('instagram', tree.instagram || '', 'href')
    this.setTreeValue('twitter', tree.twitter || '', 'href')
    this.setTreeValue('link', treeLink, 'href')
    this.setTreeValue('streetview', tree.streetview, 'src')

    // Open the drawer
    this.classList.add('show')
    window.Arbolado.callOnEscPush(this.close)
    window.Arbolado.toggleOverlay(true)
    this.open = true

    if (updateURL) {
      this.previousUrl = window.location.toString()
      const url = `${window.location.protocol}//${window.location.host}${treeLink}`
      history.pushState(null, '', url)
    }
  }

  private hasFocus(within: boolean = false) {
    if (within) return this.matches(':focus, :focus-within')
    else return this.matches(':focus')
  }

  private handleFocusOut() {
    if (!this.open) return
    if (!this.hasFocus(true)) this.focus()
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.open) return
    if (((event.shiftKey) && (event.key === 'Tab')) && (this.hasFocus())) event.preventDefault()
  }
}