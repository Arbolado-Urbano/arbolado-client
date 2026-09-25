import { ExpressionSpecification, GeoJSONSource, LngLatBounds, LngLatLike, Map, NavigationControl } from 'mapbox-gl'

import { GeoJSONTrees, TreeList } from '../../types/Tree'

import GeoBtn from '../GeoBtn/GeoBtn'

import { MapLayerSwitcher } from '../MapLayerSwitcher/MapLayerSwitcher'

import { DEFAULTS, ICON_PATH } from '../../constants/speciesStyles'

export const styles = {
  streets: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

export type StyleOption = keyof typeof styles

export default class MapElement extends HTMLElement {
  private allTrees: GeoJSONTrees["features"] = []
  private source: GeoJSONSource | undefined
  private readonly SOURCE_ID = "trees"
  private readonly CLUSTER_MAX_ZOOM = 16
  private readonly map = new Map({
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
    container: 'map',
    style: styles.streets,
    center: [-58.44, -34.618], // BsAs
    language: "es-419",
    zoom: 12,
    maxZoom: 21,
    minZoom: 2,
  })

  constructor() {
    super()

    // Navigation controls
    this.map.addControl(new NavigationControl({ showCompass: true }), 'top-left')

    // Layer switcher
    this.map.addControl(new MapLayerSwitcher('streets'), 'bottom-right')

    // TODO: GEO button and rest of the UI, see if I can load all of them as a layer or something

    // Initialize Geo button
    const geoBtn = document.querySelector('[js-map-geo-btn]') as GeoBtn
    geoBtn.addEventListener('arbolado:geo/searching', () => window.Arbolado.setLoading(true))
    geoBtn.addEventListener('arbolado:geo/error', () => window.Arbolado.setLoading(false))
    geoBtn.addEventListener('arbolado:geo/success', (event) => {
      const { lat, lng } = event.detail
      this.center([lng, lat])
      window.Arbolado.setLoading(false)
    })

    // Update map bounds on move
    this.map.on('move', () => {
      const bounds = this.map.getBounds()
      if (bounds) {
        window.Arbolado.emitEvent(this, 'arbolado:map/move', { bounds })
      }
    })

    this.map.on('load', () => {
      this.addLayers()
      this.source = this.map.getSource<GeoJSONSource>(this.SOURCE_ID)
      if (window.Arbolado.species !== undefined) {
        this.loadData()
      } else {
        document.addEventListener('arbolado:species/loaded', () => this.loadData())
      }
    })
  }

  public center(center: LngLatLike, zoom?: number) {
    this.map.flyTo({ center, zoom })
  }

  public setStyle(style: keyof typeof styles) {
    this.map.setStyle(styles[style])
  }

  private zoomToFilteredResults(features: any[]) {
    if (!features.length) return

    const bounds = new LngLatBounds()
    for (const feature of features) {
      bounds.extend(feature.geometry.coordinates as [number, number])
    }

    this.map.fitBounds(bounds, {
      padding: 60,
      maxZoom: this.CLUSTER_MAX_ZOOM,
      duration: 800,
    })
  }

  private async loadData() {
    window.Arbolado.setLoading(true)
    try {
      this.map.once("idle", () => window.Arbolado.emitEvent(this, 'arbolado:map/loaded'))
      await this.loadTrees()
    } catch (err) {
      console.error(err)
    }
    window.Arbolado.setLoading(false)
  }

  private loadImage(path: string): Promise<HTMLImageElement | ImageBitmap | ImageData> {
    return new Promise((resolve, reject) => {
      this.map.loadImage(path, (error, result) => {
        if (error) return reject(error)
        return resolve(result!)
      })
    })
  }

  private addLayers() {
    const species = window.Arbolado.species ?? []

    const icons: [number, string][] = species.filter(species => species.icono).map(species => [species.id!, species.icono!])
    const iconImage = icons.length ? [
      'match',
      ['get', 'species'],
      ...icons.flat(),
      DEFAULTS.icon,
    ] as unknown as ExpressionSpecification : DEFAULTS.icon

    // Load marker images
    const uniqueIcons = [...new Set(icons.map(icon => icon[1])), DEFAULTS.icon]
    uniqueIcons.map(async (iconName) => {
      if (!iconName || this.map.hasImage(iconName)) return
      try {
        const image = await this.loadImage(`${ICON_PATH}${iconName}`)
        this.map.addImage(iconName, image)
      } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`, error)
      }
    })

    this.map.addSource('trees', {
      type: 'geojson',
      data: this.allTrees,
      cluster: true,
      clusterMaxZoom: this.CLUSTER_MAX_ZOOM,
      clusterRadius: 50
    })

    // Clusters
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: this.SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': DEFAULTS.color,
        'circle-radius': [
          'step', ['get', 'point_count'],
          16, 50,
          22, 200,
          28
        ]
      },
    })

    // Cluster count numbers
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: this.SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12
      }
    })

    this.map.addLayer({
      id: 'icons',
      type: 'symbol',
      source: this.SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': iconImage,
        'icon-size': 1,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })

    // Icon click -> popup with tree data
    this.map.on('click', 'icons', (event) => {
      const { id } = event.features![0].toJSON().properties
      window.Arbolado.emitEvent(this, 'arbolado:tree/selected', { id })
    })

    // Cluster click -> zoom in
    this.map.on('click', 'clusters', (event) => {
      const features = this.map.queryRenderedFeatures(event.point, { layers: ['clusters'] })
      const clusterId = features[0].toJSON().properties.cluster_id
      this.source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error) {
          console.error(error)
          return
        }
        this.map.easeTo({ center: features[0].toJSON().geometry.coordinates, zoom: zoom ?? undefined })
      })
    })

    this.map.on('mouseenter', 'icons', () => this.map.getCanvas().style.cursor = 'pointer')
    this.map.on('mouseleave', 'icons', () => this.map.getCanvas().style.cursor = '')
    this.map.on('mouseenter', 'clusters', () => this.map.getCanvas().style.cursor = 'pointer')
    this.map.on('mouseleave', 'clusters', () => this.map.getCanvas().style.cursor = '')
  }

  public loadTrees = async () => {
    const { filters } = window.Arbolado
    let response: Response | undefined
    if (!filters) {
      if (this.allTrees.length === 0) {
        response = await window.Arbolado.fetchAPI('/arboles')
        if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
        const trees: TreeList = await response.json()
        this.allTrees = trees.map(this.treeToGeoJSONFeature)
      }
      this.source?.setData({ type: "FeatureCollection", features: this.allTrees })
    } else if (filters.sourceUrl) {
      response = await window.Arbolado.fetchAPI(`/fuentes/${filters.sourceUrl}`)
      if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
      const trees: TreeList = await response.json()
      const features = trees.map(this.treeToGeoJSONFeature)
      this.map.once('idle', () => this.zoomToFilteredResults(features))
      this.source?.setData({ type: "FeatureCollection", features })
    } else {
      if (this.allTrees.length === 0) {
        response = await window.Arbolado.fetchAPI('/arboles')
        if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
        const trees: TreeList = await response.json()
        this.allTrees = trees.map(this.treeToGeoJSONFeature)
      }
      const species = window.Arbolado.species?.filter(species => {
        if (!species.url) return false
        if (filters.speciesUrl) {
          if (species.url !== filters.speciesUrl) return false
        }
        if (filters.flavors) {
          if (species.comestible !== 'Sí' && species.medicinal !== 'Sí') return false
        }
        return true
      }).map(species => species.id)

      const filtered = this.allTrees.filter(feature => {
        if (species?.indexOf(feature.properties.species) === -1) return false
        return true
      })
      this.map.once('idle', () => this.zoomToFilteredResults(filtered))
      this.source?.setData({ type: "FeatureCollection", features: filtered })
    }
  }

  private treeToGeoJSONFeature(tree: TreeList[number]): GeoJSONTrees["features"][number] {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [tree.lng, tree.lat]
      },
      properties: {
        id: tree.id,
        species: tree.species,
      }
    }
  }
}