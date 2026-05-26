import { Map, GeoJSONSource, LngLatBounds } from 'maplibre-gl'

import Tree from "../../types/Tree"

import MapElement from './MapElement'

export class TreeLayer {
  private readonly TREES_SOURCE = 'trees-source'
  private readonly TREES_LAYER = 'trees-layer'
  private map: Map
  private parent: MapElement
  private trees: Tree[] = []

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
    this.map.loadImage('/imgs/markers/marker-default.png').then(image => this.map.addImage('marker-default.png', image.data))

    // this.map.addLayer({
    //   id: this.TREES_LAYER,
    //   type: 'circle',
    //   source: this.TREES_SOURCE,
    //   minzoom: 0,
    //   maxzoom: 17,
    //   paint: {
    //     'circle-color': '#5cba9d',
    //     'circle-radius': [
    //       'interpolate', ['linear'], ['zoom'],
    //       10, 1.5,
    //       14, 4,
    //       18, 8
    //     ],
    //     'circle-stroke-width': [
    //       'interpolate', ['linear'], ['zoom'],
    //       10, 0,
    //       14, 1
    //     ],
    //     'circle-stroke-color': '#fff',
    //   },
    // })

    this.map.addLayer({
      id: this.TREES_LAYER,
      type: 'symbol',
      source: this.TREES_SOURCE,
      // minzoom: 17,
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.2,
          15, 0.5,
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

  public displayTrees(trees: Tree[] = []) {
    this.trees = trees
    const source = this.map.getSource(this.TREES_SOURCE) as GeoJSONSource
    source.setData({
      type: 'FeatureCollection',
      features: trees.map((tree) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [tree.lng, tree.lat] },
        properties: { id: tree.id, icon: !tree.species.icono ? 'marker-default.png' : tree.species.icono },
      })),
    })

    const uniqueIcons = [...new Set(trees.map(t => t.species.icono ?? 'marker-default.png'))]
    uniqueIcons.map(name =>
      new Promise<void>(async (resolve) => {
        if (!name) return resolve()
        if (this.map.hasImage(name)) return resolve()
        const image = await this.map.loadImage(`/imgs/markers/${name}`)
        this.map.addImage(name, image.data)
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