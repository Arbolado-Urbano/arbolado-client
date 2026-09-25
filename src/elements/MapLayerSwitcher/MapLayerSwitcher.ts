import { IControl, Map } from 'mapbox-gl'

import { StyleOption, styles } from '../MapElement/MapElement'

import MapLayerSwitcherTemplate from './MapLayerSwitcher.html?raw'

export class MapLayerSwitcher implements IControl {
  private map?: Map
  private container?: HTMLElement
  private active: StyleOption

  constructor(initialStyle: StyleOption = 'streets') {
    this.active = initialStyle
  }

  onAdd(map: Map): HTMLElement {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
    this.container.setAttribute('role', 'group')
    this.container.setAttribute('aria-label', 'Capa')

    this.container.innerHTML = MapLayerSwitcherTemplate

    this.container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTo(btn.dataset.style as StyleOption)
      })
    })

    return this.container
  }

  onRemove(): void {
    this.container?.remove()
    this.map = undefined
  }

  switchTo(style: StyleOption): void {
    if (!this.map || style === this.active) return
    this.map.setStyle(styles[style])
    this.active = style
    this.container?.querySelectorAll('button').forEach(btn => {
      const isActive = btn.dataset.style === style
      if (isActive) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }
}