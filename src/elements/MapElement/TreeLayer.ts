import { Map, GeoJSONSource, LngLatBounds, addProtocol, ExpressionSpecification } from 'maplibre-gl'

import { Protocol } from 'pmtiles'

import { TreeList } from '../../types/Tree'

import MapElement from './MapElement'
import { DEFAULTS, getSpeciesStyle, ICON_PATH, SPECIES_COLORS, SPECIES_ICONS } from '../../constants/speciesStyles'

export class TreeLayer {
  private readonly TREES_SOURCE = 'trees-source'
  private readonly ICONS_LAYER = 'icons-layer'
  private readonly DOTS_LAYER = 'dots-layer'
  private map: Map
  private parent: MapElement
  private trees: TreeList = []

  constructor(map: Map, parent: MapElement) {
    this.map = map
    this.parent = parent
    this.init()
  }

  public hasTrees() {
    return this.trees.length > 0
  }

  private init() {
    // Register PMTiles protocol
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    this.map.addSource(this.TREES_SOURCE, {
      type: 'vector',
      url: `pmtiles:///arboles.pmtiles`,
      // cluster: true,
      // clusterMaxZoom: 14,
      // clusterRadius: 128,
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
      minzoom: 0,
      maxzoom: 15,
      paint: {
        'circle-color': [
          'match',
          ['get', 'speciesUrl'],
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
          ['get', 'speciesUrl'],
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
      if (id != null) this.parent.selectTree(id)
    })

    // Pointer cursor on hover
    this.map.on('mouseenter', [this.ICONS_LAYER, this.DOTS_LAYER], () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', [this.ICONS_LAYER, this.DOTS_LAYER], () => {
      this.map.getCanvas().style.cursor = ''
    })
  }

  public displayTrees(trees: TreeList = []) {
    this.trees = trees
    const source = this.map.getSource(this.TREES_SOURCE) as GeoJSONSource
    source.setData({
      type: 'FeatureCollection',
      features: trees.map((tree) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [tree.lng, tree.lat] },
        properties: { id: tree.id, ...getSpeciesStyle(tree.species) },
      })),
    })

    const uniqueIcons = [...new Set(trees.map(tree => getSpeciesStyle(tree.species).icon))]
    uniqueIcons.map(iconName =>
      new Promise<void>(async (resolve) => {
        if (!iconName) return resolve()
        if (this.map.hasImage(iconName)) return resolve()
        const image = await this.map.loadImage(`${ICON_PATH}${iconName}`)
        this.map.addImage(iconName, image.data)
        resolve()
      })
    )

    if (trees.length) {
      const bounds = trees.reduce(
        (b, t) => b.extend([t.lng, t.lat]),
        new LngLatBounds([trees[0].lng, trees[0].lat], [trees[0].lng, trees[0].lat]),
      )
      this.map.fitBounds(bounds, { maxZoom: 18, padding: 15 })
    }
  }
}