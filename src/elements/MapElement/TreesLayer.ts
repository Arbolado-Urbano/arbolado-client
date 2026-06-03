import { Map, addProtocol, ExpressionSpecification } from 'maplibre-gl'

import { Protocol } from 'pmtiles'

import { SpeciesFilters } from '../../types/Species'

import { DEFAULTS, ICON_PATH } from '../../constants/speciesStyles'

import MapElement from './MapElement'

export class TreesLayer {
  private readonly TREES_SOURCE = 'trees-source'
  private readonly ICONS_LAYER = 'icons-layer'
  private readonly DOTS_LAYER = 'dots-layer'
  private readonly TRANSITION_ZOOM_LEVEL = 16
  private map: Map

  constructor(map: Map, parent: MapElement) {
    this.map = map
    if (window.Arbolado.species !== undefined) {
      this.init(parent)
    } else {
      document.addEventListener('arbolado:species/loaded', () => this.init(parent))
    }
  }

  init(parent: MapElement) {
    window.Arbolado.setLoading(true)
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    this.map.addSource(this.TREES_SOURCE, {
      type: 'vector',
      url: `pmtiles://${import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL}/arboles.pmtiles`,
    })

    const species = window.Arbolado.species ?? []
    const icons: [number, string][] = species.filter(species => species.icono).map(species => [species.id, species.icono!])
    const colors: [number, string][] = species.filter(species => species.color).map(species => [species.id, species.color!])

    // Load marker images
    const uniqueIcons = [...new Set(icons.map(icon => icon[1])), DEFAULTS.icon]
    uniqueIcons.map(async (iconName) => {
      if (!iconName || this.map.hasImage(iconName)) return
      try {
        const image = await this.map.loadImage(`${ICON_PATH}${iconName}`)
        this.map.addImage(iconName, image.data)
      } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`, error)
      }
    })

    const circleColor = colors.length ? [
      'match',
      ['get', 'species'],
      ...colors.flat(),
      DEFAULTS.color,
    ] as unknown as ExpressionSpecification : DEFAULTS.color

    this.map.addLayer({
      id: this.DOTS_LAYER,
      type: 'circle',
      source: this.TREES_SOURCE,
      'source-layer': 'trees',
      maxzoom: this.TRANSITION_ZOOM_LEVEL,
      paint: {
        'circle-color': circleColor,
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 1,
          14, 5,
          18, 8
        ],
        'circle-stroke-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0,
          14, 1
        ],
        'circle-stroke-color': '#fff',
      },
    })

    const iconImage = icons.length ? [
      'match',
      ['get', 'species'],
      ...icons.flat(),
      DEFAULTS.icon,
    ] as unknown as ExpressionSpecification : DEFAULTS.icon

    this.map.addLayer({
      id: this.ICONS_LAYER,
      type: 'symbol',
      source: this.TREES_SOURCE,
      'source-layer': 'trees',
      minzoom: this.TRANSITION_ZOOM_LEVEL,
      layout: {
        'icon-image': iconImage,
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.2,
          15, 0.3,
          21, 1.5,
        ],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })

    this.map.on('click', [this.ICONS_LAYER, this.DOTS_LAYER], (event) => {
      const id = event.features?.[0]?.properties?.id
      // Emit an event from the parent map with the selected tree's ID
      window.Arbolado.emitEvent(parent, 'arbolado:tree/selected', { id })
    })

    // Pointer cursor on hover
    this.map.on('mouseenter', [this.ICONS_LAYER, this.DOTS_LAYER], () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', [this.ICONS_LAYER, this.DOTS_LAYER], () => {
      this.map.getCanvas().style.cursor = ''
    })
    window.Arbolado.setLoading(false)
  }

  public filterSpecies(filters: SpeciesFilters) {
    const species = window.Arbolado.species?.filter(species => {
      if (!species.url) return false
      if (filters.url) {
        if (species.url !== filters.url) return false
      }
      if (filters.user_sabores) {
        if (species.comestible !== 'Sí' && species.medicinal !== 'Sí') return false
      }
      return true
    }).map(species => species.id)
    const filter: ExpressionSpecification = ['in', ['get', 'species'], ['literal', species]]
    this.map.setFilter(this.ICONS_LAYER, filter)
    this.map.setFilter(this.DOTS_LAYER, filter)
  }
}