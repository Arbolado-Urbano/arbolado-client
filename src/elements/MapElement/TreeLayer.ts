import { Map, addProtocol, ExpressionSpecification } from 'maplibre-gl'

import { Protocol } from 'pmtiles'

import { SpeciesFilters } from '../../types/Species'

import { DEFAULTS, ICON_PATH, SPECIES_COLORS, SPECIES_ICONS } from '../../constants/speciesStyles'

import MapElement from './MapElement'

export class TreeLayer {
  private readonly TREES_SOURCE = 'trees-source'
  private readonly ICONS_LAYER = 'icons-layer'
  private readonly DOTS_LAYER = 'dots-layer'
  private map: Map

  constructor(map: Map, parent: MapElement) {
    this.map = map
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    this.map.addSource(this.TREES_SOURCE, {
      type: 'vector',
      url: `pmtiles:///arboles.pmtiles`,
    })

    // Load marker images
    const uniqueIcons = [...new Set(SPECIES_ICONS.map(icon => icon[1])), DEFAULTS.icon]
    uniqueIcons.map(iconName =>
      new Promise<void>(async (resolve) => {
        if (!iconName) return resolve()
        if (this.map.hasImage(iconName)) return resolve()
        const image = await this.map.loadImage(`${ICON_PATH}${iconName}`)
        this.map.addImage(iconName, image.data)
        resolve()
      })
    )

    this.map.addLayer({
      id: this.DOTS_LAYER,
      type: 'circle',
      source: this.TREES_SOURCE,
      'source-layer': 'trees',
      maxzoom: 15,
      paint: {
        'circle-color': [
          'match',
          ['get', 'species'],
          ...SPECIES_COLORS.flat(),
          DEFAULTS.color,
        ] as unknown as ExpressionSpecification,
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 4,
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

    this.map.addLayer({
      id: this.ICONS_LAYER,
      type: 'symbol',
      source: this.TREES_SOURCE,
      'source-layer': 'trees',
      minzoom: 15,
      layout: {
        'icon-image': [
          'match',
          ['get', 'species'],
          ...SPECIES_ICONS.flat(),
          DEFAULTS.icon,
        ] as unknown as ExpressionSpecification,
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
  }

  public filterSpecies(filters: SpeciesFilters) {
    const species = window.Arbolado.species.filter(species => {
      if (!species.url) return false
      if (filters.url) {
        if (species.url !== filters.url) return false
      }
      if (filters.user_sabores) {
        if (species.comestible !== 'Sí' && species.medicinal !== 'Sí') return false
      }
      if (filters.borigen_cuyana) {
        if (!species.region_cuyana) return false
      }
      if (filters.borigen_nea) {
        if (!species.region_nea) return false
      }
      if (filters.borigen_noa) {
        if (!species.region_noa) return false
      }
      if (filters.borigen_pampeana) {
        if (!species.region_pampeana) return false
      }
      if (filters.borigen_patagonica) {
        if (!species.region_patagonica) return false
      }
      return true
    }).map(species => species.url)
    const filter: ExpressionSpecification = ['in', ['get', 'species'], ['literal', species]]
    this.map.setFilter(this.ICONS_LAYER, filter)
    this.map.setFilter(this.DOTS_LAYER, filter)
  }
}