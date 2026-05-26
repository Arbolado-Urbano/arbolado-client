import { IControl, Map } from 'maplibre-gl'

import MapLayerSwitcherTemplate from './MapLayerSwitcher.html?raw'

export type BaseLayerId = 'streets' | 'satellite'

export class MapLayerSwitcher implements IControl {
  private map?: Map
  private container?: HTMLElement
  private active: BaseLayerId

  constructor(initialLayer: BaseLayerId = 'streets') {
    this.active = initialLayer
  }

  onAdd(map: Map): HTMLElement {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    this.container.setAttribute('role', 'group')
    this.container.setAttribute('aria-label', 'Capa')

    this.container.innerHTML = MapLayerSwitcherTemplate

    this.container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTo(btn.dataset.layer as BaseLayerId)
      })
    })

    return this.container
  }

  onRemove(): void {
    this.container?.remove()
    this.map = undefined
  }

  switchTo(layer: BaseLayerId): void {
    if (!this.map || layer === this.active) return
    this.map.setLayoutProperty('streets', 'visibility', layer === 'streets' ? 'visible' : 'none')
    this.map.setLayoutProperty('satellite', 'visibility', layer === 'satellite' ? 'visible' : 'none')
    this.active = layer
    this.container?.querySelectorAll('button').forEach(btn => {
      const isActive = btn.dataset.layer === layer
      if (isActive) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }
}