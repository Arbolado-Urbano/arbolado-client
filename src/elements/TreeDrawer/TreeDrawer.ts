import TreeDrawerTemplate from './TreeDrawer.html?raw'
import RecordAccordionTemplate from './RecordAccordion.html?raw'

import { Collapse } from 'bootstrap'

import { Tree, TreeRecord } from '../../types/Tree'

type TreeData = {
  id: { element: HTMLElement, label?: string },
  nombre_cientifico: { element: HTMLElement, label?: string },
  nombre_comun: { element: HTMLElement, label?: string },
  tipo: { element: HTMLElement, label?: string },
  familia: { element: HTMLElement, label?: string },
  origen: { element: HTMLElement, label?: string },
  procedencia_exotica: { element: HTMLElement, label?: string },
  regiones: { element: HTMLElement, label?: string },
  espacio_verde: { element: HTMLElement, label?: string },
  calle: { element: HTMLElement, label?: string },
  nombre: { element: HTMLElement, label?: string },
  fecha_creacion: { element: HTMLElement, label?: string },
  descripcion: { element: HTMLElement, label?: string },
  url: { element: HTMLAnchorElement, label?: string },
  facebook: { element: HTMLAnchorElement, label?: string },
  instagram: { element: HTMLAnchorElement, label?: string },
  twitter: { element: HTMLAnchorElement, label?: string },
  streetview: { element: HTMLIFrameElement, label?: string },
  link: { element: HTMLAnchorElement, label?: string },
}
type treeDataKey = keyof TreeData

export default class TreeModal extends HTMLElement {
  private static readonly healthLabels: Record<string, string> = {
    sano: 'Sano',
    hongos: 'Hojas con hongos',
    hueco: 'Tronco ahuecado',
    plaga: 'Plagado de insectos',
    otros: 'Enfermo',
  }
  private static readonly placeLabels: Record<string, string> = {
    'plantera': 'Plantera',
    'cinta verde': 'Cinta verde',
    'plaza-parque': 'Plaza / Parque',
  }
  // Upper bound (in degrees) of each inclination range, same ranges as in the add tree form
  private static readonly inclinationLabels: [number, string][] = [
    [5, 'Tronco normal (0º a 5º)'],
    [15, 'Levemente inclinado (5º a 15º)'],
    [25, 'Moderadamente inclinado (15º a 25º)'],
    [35, 'Riesgo de caída (25º a 35º)'],
    [Infinity, 'Muy riesgoso (más de 35º)'],
  ]
  private open: boolean = false
  private streetViewUrl: string
  private closeBtn: HTMLButtonElement
  private treeData: TreeData
  private recordData: HTMLElement
  private previousUrl?: string

  constructor() {
    super()
    this.innerHTML = TreeDrawerTemplate
    this.close = this.close.bind(this)
    this.handleFocusOut = this.handleFocusOut.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)

    const { VITE_GOOGLE_MAPS_STREET_VIEW_URL, VITE_GOOGLE_MAPS_API_KEY } = import.meta.env
    this.streetViewUrl = `${VITE_GOOGLE_MAPS_STREET_VIEW_URL}&key=${VITE_GOOGLE_MAPS_API_KEY}`

    this.closeBtn = this.querySelector('[js-close]') as HTMLButtonElement
    this.closeBtn.addEventListener('click', () => this.close())

    this.recordData = this.querySelector('[js-record-data]') as HTMLElement
    this.treeData = {
      id: { element: this.querySelector('[js-tree-data="id"]') as HTMLElement },
      nombre_cientifico: { element: this.querySelector('[js-tree-data="nombre_cientifico"]') as HTMLElement },
      nombre_comun: { element: this.querySelector('[js-tree-data="nombre_comun"]') as HTMLElement },
      tipo: { element: this.querySelector('[js-tree-data="tipo"]') as HTMLElement },
      familia: { element: this.querySelector('[js-tree-data="familia"]') as HTMLElement, label: 'Familia:' },
      origen: { element: this.querySelector('[js-tree-data="origen"]') as HTMLElement, label: 'Origen:' },
      procedencia_exotica: { element: this.querySelector('[js-tree-data="procedencia_exotica"]') as HTMLElement, label: 'Procedencia:' },
      regiones: { element: this.querySelector('[js-tree-data="regiones"]') as HTMLElement, label: 'Región de origen:' },
      espacio_verde: { element: this.querySelector('[js-tree-data="espacio_verde"]') as HTMLElement },
      calle: { element: this.querySelector('[js-tree-data="calle"]') as HTMLElement },
      nombre: { element: this.querySelector('[js-tree-data="nombre"]') as HTMLElement, label: 'Datos aportados por' },
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
    document.addEventListener('arbolado:overlay/click', () => this.close())
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

  private setTreeRecords(tree: Tree) {
    const recordsElement = this.querySelector('[js-sources]') as HTMLDivElement
    recordsElement.innerHTML = ''
    tree.records.forEach((record, index) => {
      const { descripcion, nombre, facebook, instagram, twitter, url } = record.source
      const recordElement = window.Arbolado.loadTemplate(RecordAccordionTemplate) as HTMLElement
      const toggle = recordElement.querySelector('[js-record-toggle]') as HTMLButtonElement
      const collapseElement = recordElement.querySelector('[js-record-collapse]') as HTMLDivElement
      const dateElement = recordElement.querySelector('[js-record-date]') as HTMLElement
      const sourceNameElement = recordElement.querySelector('[js-source-name]') as HTMLElement
      const descriptionElement = recordElement.querySelector('[js-source-description]') as HTMLParagraphElement
      const urlElement = recordElement.querySelector('[js-source-url]') as HTMLAnchorElement
      const facebookElement = recordElement.querySelector('[js-source-facebook]') as HTMLAnchorElement
      const instagramElement = recordElement.querySelector('[js-source-instagram]') as HTMLAnchorElement
      const twitterElement = recordElement.querySelector('[js-source-twitter]') as HTMLAnchorElement
      const collapseId = `tree-record-${record.id}`
      collapseElement.id = collapseId
      toggle.setAttribute('aria-controls', collapseId)
      dateElement.innerText = this.formatDate(record.fecha_creacion)
      sourceNameElement.innerText = nombre
      this.renderRecordData(recordElement.querySelector('[js-record-data]') as HTMLElement, record)
      if (!descripcion) descriptionElement.remove()
      else descriptionElement.innerText = descripcion
      if (!url) urlElement.remove()
      else urlElement.href = url
      if (!facebook) facebookElement.remove()
      else facebookElement.href = facebook
      if (!instagram) instagramElement.remove()
      else instagramElement.href = instagram
      if (!twitter) twitterElement.remove()
      else twitterElement.href = twitter

      // Only the most recent record starts expanded
      if (index === 0) {
        collapseElement.classList.add('show')
        this.setRecordExpanded(toggle, true)
      }
      const collapse = new Collapse(collapseElement, { toggle: false })
      toggle.addEventListener('click', () => collapse.toggle())
      collapseElement.addEventListener('show.bs.collapse', () => this.setRecordExpanded(toggle, true))
      collapseElement.addEventListener('hide.bs.collapse', () => this.setRecordExpanded(toggle, false))
      recordsElement.appendChild(recordElement)
    })
  }

  private setRecordExpanded(toggle: HTMLButtonElement, expanded: boolean) {
    toggle.classList.toggle('collapsed', !expanded)
    toggle.setAttribute('aria-expanded', expanded.toString())
  }

  /** Human readable label/value pairs for the data of a record, skipping empty values */
  private formatRecord(record: TreeRecord): [string, string][] {
    const { cobertura, etapa_desarrollo, estado_fitosanitario, lugar } = record
    const data: [string, string | undefined][] = [
      ['Altura', this.formatMeasure(record.altura, 'm')],
      ['Inclinación', this.formatInclination(record.inclinacion)],
      ['Diámetro de tronco', this.formatMeasure(record.diametro_a_p, 'cm')],
      ['Diámetro de copa', this.formatMeasure(record.diametro_copa, 'm')],
      ['Altura de copa', this.formatMeasure(record.altura_copa, 'm')],
      ['Altura de tronco', this.formatMeasure(record.altura_tronco, 'm')],
      ['Cobertura de copa', cobertura ? `${cobertura.replace('-', '% a ')}%` : undefined],
      ['Etapa de desarrollo', etapa_desarrollo ? this.capitalize(etapa_desarrollo) : undefined],
      ['Estado fitosanitario', estado_fitosanitario ? (TreeModal.healthLabels[estado_fitosanitario] ?? this.capitalize(estado_fitosanitario)) : undefined],
      ['Lugar', lugar ? (TreeModal.placeLabels[lugar] ?? this.capitalize(lugar)) : undefined],
    ]
    return data.filter((item): item is [string, string] => !!item[1])
  }

  private renderRecordData(container: HTMLElement, record?: TreeRecord) {
    container.innerHTML = ''
    const data = record ? this.formatRecord(record) : []
    for (const [label, value] of data) {
      const element = document.createElement('span')
      element.innerText = `${label}: ${value}`
      container.appendChild(element)
    }
    container.classList.toggle('d-none', !data.length)
  }

  /** Measures equal to 0 are treated as missing (older censuses stored 0 when there was no value) */
  private formatMeasure(value: string | undefined, unit: string) {
    const number = parseFloat(value ?? '')
    if (!number) return undefined
    return `${number.toLocaleString('es-AR')} ${unit}`
  }

  private formatInclination(value?: string) {
    const degrees = parseFloat(value ?? '')
    if (isNaN(degrees)) return undefined
    return TreeModal.inclinationLabels.find(([max]) => degrees <= max)?.[1]
  }

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  private formatDate(dateString: string) {
    const date = new Date(dateString)
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
    return `${day}/${month}/${date.getFullYear()}`
  }

  async displayTree(treeId: string, updateURL: boolean = true) {
    try {
      const response = await window.Arbolado.fetchAPI(`/arboles/${treeId}`)
      if (!response.ok) {
        window.Arbolado.alert("danger", "Ocurrió un error al cargar el árbol")
        return
      }
      const tree: Tree | undefined = await response.json()
      if (!tree) {
        throw new Error('No JSON response from API')
      }
      // If there's no streetview URL for the tree, use its coordinates
      if (!tree.streetview) {
        tree.streetview = `${this.streetViewUrl}&location=${tree.lat},${tree.lng}`
      }

      const treeLink = `/arbol/${tree.id}`

      this.setTreeValue('nombre_cientifico', tree.species.nombre_cientifico)
      this.setTreeValue('nombre_comun', tree.species.nombre_comun)
      this.setTreeValue('tipo', tree.species.type.tipo)
      this.setTreeValue('familia', tree.species.family.familia)
      this.setTreeValue('origen', tree.species.origen)
      this.setTreeValue('procedencia_exotica', tree.species.procedencia_exotica)
      this.renderRecordData(this.recordData, tree.records[0])
      this.setTreeValue('espacio_verde', tree.espacio_verde ? `Espacio verde: ${tree.espacio_verde}` : undefined)
      this.setTreeValue('calle', `${tree.calle || ''} ${tree.calle_altura ? tree.calle_altura : 's/n'}`)
      this.setTreeValue('id', tree.id.toString())
      this.setTreeValue('link', treeLink, 'href')
      this.setTreeValue('streetview', tree.streetview, 'src')
      this.setTreeRecords(tree)

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

      window.Arbolado.emitEvent(this, 'arbolado:tree/displayed', { tree })
    } catch (error) {
      console.error(error)
      window.Arbolado.alert('danger', 'Ocurrió un error. Intenta nuevamente más tarde.')
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