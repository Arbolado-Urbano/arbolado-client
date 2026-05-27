import { Map, GeoJSONSource, LngLatBounds } from 'maplibre-gl'

import { TreeList } from "../../types/Tree"

import MapElement from './MapElement'
import { DEFAULTS, getSpeciesStyle, ICON_PATH } from '../../constants/speciesStyles'

export class TreeLayer {
  private readonly TREES_SOURCE = 'trees-source'
  private readonly TREES_LAYER = 'trees-layer'
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
    this.map.addSource(this.TREES_SOURCE, {
      type: 'geojson',
      // cluster: true,
      // clusterMaxZoom: 14,
      // clusterRadius: 128,
      data: { type: 'FeatureCollection', features: [] },
    })

    // Load marker image once
    this.map.loadImage(`${ICON_PATH}${DEFAULTS.icon}`).then(image => this.map.addImage(DEFAULTS.icon, image.data))

    this.map.addLayer({
      id: `${this.TREES_LAYER}-dots`,
      type: 'circle',
      source: this.TREES_SOURCE,
      minzoom: 0,
      maxzoom: 15,
      paint: {
        'circle-color': ['get', 'color'],
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
      id: this.TREES_LAYER,
      type: 'symbol',
      source: this.TREES_SOURCE,
      minzoom: 15,
      layout: {
        'icon-image': ['get', 'icon'],
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

    this.map.on('click', this.TREES_LAYER, (event) => {
      const id = event.features?.[0]?.properties?.id
      if (id != null) this.parent.selectTree(id)
    })

    // Pointer cursor on hover
    this.map.on('mouseenter', this.TREES_LAYER, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', this.TREES_LAYER, () => {
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