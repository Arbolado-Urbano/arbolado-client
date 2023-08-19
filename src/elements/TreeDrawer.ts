import Tree from '../types/Tree'
type TreeData = {
  id: { element: HTMLElement, label?: string },
  nombre_cientifico: { element: HTMLElement, label?: string },
  nombre_comun: { element: HTMLElement, label?: string },
  tipo: { element: HTMLElement, label?: string },
  familia: { element: HTMLElement, label?: string },
  origen: { element: HTMLElement, label?: string },
  procedencia_exotica: { element: HTMLElement, label?: string },
  regiones: { element: HTMLElement, label?: string },
  altura: { element: HTMLElement, label?: string },
  espacio_verde: { element: HTMLElement, label?: string  },
  calle: { element: HTMLElement, label?: string  },
  nombre: { element: HTMLElement, label?: string },
  fecha_creacion: { element: HTMLElement, label?: string  },
  descripcion: { element: HTMLElement, label?: string  },
  url: { element: HTMLAnchorElement, label?: string  },
  facebook: { element: HTMLAnchorElement, label?: string  },
  instagram: { element: HTMLAnchorElement, label?: string  },
  twitter: { element: HTMLAnchorElement, label?: string  },
  streetview: { element: HTMLIFrameElement, label?: string  },
  link: { element: HTMLAnchorElement, label?: string  },
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
      id: { element: this.querySelector('[js-tree-data="id"]') as HTMLElement },
      nombre_cientifico: { element: this.querySelector('[js-tree-data="nombre_cientifico"]') as HTMLElement },
      nombre_comun: { element: this.querySelector('[js-tree-data="nombre_comun"]') as HTMLElement },
      tipo: { element: this.querySelector('[js-tree-data="tipo"]') as HTMLElement },
      familia: { element: this.querySelector('[js-tree-data="familia"]') as HTMLElement, label: 'Familia:' },
      origen: { element: this.querySelector('[js-tree-data="origen"]') as HTMLElement, label: 'Origen:' },
      procedencia_exotica: { element: this.querySelector('[js-tree-data="procedencia_exotica"]') as HTMLElement, label: 'Procedencia:' },
      regiones: { element: this.querySelector('[js-tree-data="regiones"]') as HTMLElement, label: 'Región de origen:' },
      altura: { element: this.querySelector('[js-tree-data="altura"]') as HTMLElement, label: 'Altura:' },
      espacio_verde: { element: this.querySelector('[js-tree-data="espacio_verde"]') as HTMLElement },
      calle: { element: this.querySelector('[js-tree-data="calle"]') as HTMLElement },
      nombre: { element: this.querySelector('[js-tree-data="nombre"]') as HTMLElement, label: 'Dato aprotado por' },
      fecha_creacion: { element: this.querySelector('[js-tree-data="fecha_creacion"]') as HTMLElement },
      descripcion: { element: this.querySelector('[js-tree-data="descripcion"]') as HTMLElement },
      url: { element: this.querySelector('[js-tree-data="url"]') as HTMLAnchorElement },
      facebook: { element: this.querySelector('[js-tree-data="facebook"]') as HTMLAnchorElement },
      instagram: { element: this.querySelector('[js-tree-data="instagram"]') as HTMLAnchorElement },
      twitter: { element: this.querySelector('[js-tree-data="twitter"]') as HTMLAnchorElement },
      streetview: { element: this.querySelector('[js-tree-data="streetview"]') as HTMLIFrameElement },
      link: { element: this.querySelector('[js-tree-data="link"]') as HTMLAnchorElement },
    }
    this.loadTreeFromURL()
    window.addEventListener('popstate', () => this.loadTreeFromURL())
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('arbolado/overlay:click', () => this.close())
  }

  private setTreeValue(name: treeDataKey, value?: string, attribute?: string) {
    const treeData = this.treeData[name]
    treeData.element.classList.remove('d-none')
    if (value) {
      if (attribute) treeData.element.setAttribute(attribute, value)
      else {
        if (name === 'nombre') treeData.element.innerHTML = `${treeData.label || ''} <strong>${value}</strong>`
        else treeData.element.innerText = `${treeData.label || ''} ${value}`
      }
    } else {
      treeData.element.classList.add('d-none')
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

  private formatDate(dateString: string) {
    const date = new Date(dateString)
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
    return `${day}/${month}/${date.getFullYear()}`
  }

  async displayTree(treeId: string, updateURL: boolean = true) {
    const tree: Tree = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/arboles/${treeId}`)
    // If there's no streetview URL for the tree, use its coordinates
    if (!tree.streetview) {
      tree.streetview = `${this.streetViewUrl}&location=${tree.lat},${tree.lng}`
    }

    if (tree.fecha_creacion) tree.fecha_creacion = this.formatDate(tree.fecha_creacion)
    if (tree.altura) tree.altura += ' m'

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

    window.Arbolado.emitEvent(this, 'arbolado/tree:displayed', { tree })
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