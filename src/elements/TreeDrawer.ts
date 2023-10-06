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
  private sourceAccordionTemplate: HTMLTemplateElement
  
  constructor() {
    super()
    this.close = this.close.bind(this)
    this.handleFocusOut = this.handleFocusOut.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.sourceAccordionTemplate = this.querySelector('[js-template="source-accordion"]') as HTMLTemplateElement
    
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
      nombre: { element: this.querySelector('[js-tree-data="nombre"]') as HTMLElement, label: 'Datos aprotados por' },
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
  
  private setTreeSources(tree: Tree) {
    const sourcesElement = this.querySelector('[js-sources]')
    for (const record of tree.records) {
      const { fecha_creacion } = record
      const { id, descripcion, email, nombre, facebook, instagram, twitter, url } = record.source
      const sourceElement = this.sourceAccordionTemplate.content.cloneNode(true) as HTMLElement
      const accordionBtn = sourceElement.querySelector('[js-accordion-btn]') as HTMLButtonElement
      const accordion = sourceElement.querySelector('[js-accordion]') as HTMLDivElement
      const accordionBody = sourceElement.querySelector('[js-accordion-body]') as HTMLDivElement
      accordion.id = `tree-source-accordion-${id}`
      accordionBtn.innerText = `${this.formatDate(fecha_creacion)} - ${nombre}`
      accordionBtn.setAttribute('aria-controls', `#${accordion.id}`)
      accordionBtn.addEventListener('click', () => {
        if (accordion.classList.contains('show')) {
          accordion.classList.remove('show')
          accordionBtn.classList.add('collapsed')
          accordionBtn.setAttribute('aria-expanded', 'false')
        } else {
          accordion.classList.add('show')
          accordionBtn.classList.remove('collapsed')
          accordionBtn.setAttribute('aria-expanded', 'true')
        }
      })
      const descriptionElement = accordionBody.querySelector('[js-source-description]') as HTMLParagraphElement
      const emailElement = accordionBody.querySelector('[js-source-email]') as HTMLAnchorElement
      const urlElement = accordionBody.querySelector('[js-source-url]') as HTMLAnchorElement
      const facebookElement = accordionBody.querySelector('[js-source-facebook]') as HTMLAnchorElement
      const instagramElement = accordionBody.querySelector('[js-source-instagram]') as HTMLAnchorElement
      const twitterElement = accordionBody.querySelector('[js-source-twitter]') as HTMLAnchorElement
      descriptionElement.innerText = descripcion
      if (!email) emailElement.remove()
      else emailElement.href = email
      if (!url) urlElement.remove()
      else urlElement.href = url
      if (!facebook) facebookElement.remove()
      else facebookElement.href = facebook
      if (!instagram) instagramElement.remove()
      else instagramElement.href = instagram
      if (!twitter) twitterElement.remove()
      else twitterElement.href = twitter
      sourcesElement?.appendChild(sourceElement)
    }
  }

  private formatDate(dateString: string) {
    const date = new Date(dateString)
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
    return `${day}/${month}/${date.getFullYear()}`
  }

  async displayTree(treeId: string, updateURL: boolean = true) {
    const tree: Tree | undefined = await window.Arbolado.fetchJson(`${import.meta.env.VITE_API_URL}/arboles/${treeId}`)
    if (!tree) return
    // If there's no streetview URL for the tree, use its coordinates
    if (!tree.streetview) {
      tree.streetview = `${this.streetViewUrl}&location=${tree.lat},${tree.lng}`
    }

    if (tree.records[0].altura) tree.records[0].altura += ' m'

    const treeLink = `/arbol/${tree.id}`
    
    this.setTreeValue('nombre_cientifico', tree.species.nombre_cientifico)
    this.setTreeValue('nombre_comun', tree.species.nombre_comun)
    this.setTreeValue('tipo', tree.species.type.tipo)
    this.setTreeValue('familia', tree.species.family.familia)
    this.setTreeValue('origen', tree.species.origen)
    this.setTreeValue('procedencia_exotica', tree.species.procedencia_exotica)
    this.setTreeValue('altura', tree.records[0].altura)
    this.setTreeValue('espacio_verde', tree.espacio_verde ? `Espacio verde: ${tree.espacio_verde}` : undefined)
    this.setTreeValue('calle', `${tree.calle || ''} ${tree.calle_altura ? tree.calle_altura : 's/n'}`)
    this.setTreeValue('id', tree.id.toString())
    this.setTreeValue('link', treeLink, 'href')
    this.setTreeValue('streetview', tree.streetview, 'src')
    this.setTreeSources(tree)

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