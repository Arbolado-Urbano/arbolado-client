import { ExpressionSpecification, GeoJSONSource, LngLatBounds, LngLatLike, Map, NavigationControl } from "mapbox-gl"

import GeoBtn from "../GeoBtn/GeoBtn"

import { MapLayerSwitcher } from "../MapLayerSwitcher/MapLayerSwitcher"

import { DEFAULTS, ICON_PATH } from "../../constants/speciesStyles"

export const styles = {
  streets: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
}

const SOURCE_ID = "trees"
const CLUSTER_LAYER_ID = "clusters"
const ICON_LAYER_ID = "icons"
const CLUSTER_MAX_ZOOM = 16
const BEARING = 0

export type StyleOption = keyof typeof styles


export default class MapElement extends HTMLElement {
  private iconImage?: ExpressionSpecification | string
  private zoomOnResults: boolean = true
  private readonly map = new Map({
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
    container: "map",
    style: styles.streets,
    center: [-58.44, -34.618], // BsAs
    language: "es-419",
    zoom: 2,
    maxZoom: 21,
    minZoom: 2,
    bearing: BEARING,
  })

  constructor() {
    super()

    // Navigation controls
    this.map.addControl(new NavigationControl({ showCompass: true }), "top-left")

    // Layer switcher
    this.map.addControl(new MapLayerSwitcher("streets"), "bottom-right")

    // TODO: GEO button and rest of the UI, see if I can load all of them as a layer or something

    // Initialize Geo button
    const geoBtn = document.querySelector("[js-map-geo-btn]") as GeoBtn
    geoBtn.addEventListener("arbolado:geo/searching", () => window.Arbolado.setLoading(true))
    geoBtn.addEventListener("arbolado:geo/error", () => window.Arbolado.setLoading(false))
    geoBtn.addEventListener("arbolado:geo/success", (event) => {
      const { lat, lng } = event.detail
      this.center({ lng, lat })
      window.Arbolado.setLoading(false)
    })

    // Update map bounds on move
    this.map.on("move", () => {
      const bounds = this.map.getBounds()
      if (bounds) {
        window.Arbolado.emitEvent(this, "arbolado:map/move", { bounds })
      }
    })

    this.map.once("load", () => {
      if (window.Arbolado.species !== undefined) {
        this.init()
      } else {
        document.addEventListener("arbolado:species/loaded", this.init)
      }
      this.map.on("style.load", async () => {
        await this.loadTrees(false)
        this.addLayers()
      })
    })

    // Icon click -> popup with tree data
    this.map.on("click", ICON_LAYER_ID, (event) => {
      const { id } = event.features![0].toJSON().properties
      window.Arbolado.emitEvent(this, "arbolado:tree/selected", { id })
    })

    // Cluster click -> zoom in
    this.map.on("click", CLUSTER_LAYER_ID, (event) => {
      const features = this.map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER_ID] })
      const clusterId = features[0].toJSON().properties.cluster_id
      this.map.getSource<GeoJSONSource>(SOURCE_ID)?.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error) {
          console.error(error)
          return
        }
        const zoomLevel = zoom ? zoom + 2 : undefined
        this.map.easeTo({ center: features[0].toJSON().geometry.coordinates, zoom: zoomLevel, bearing: BEARING })
      })
    })

    this.map.on("mouseenter", ICON_LAYER_ID, () => this.map.getCanvas().style.cursor = "pointer")
    this.map.on("mouseleave", ICON_LAYER_ID, () => this.map.getCanvas().style.cursor = "")
    this.map.on("mouseenter", CLUSTER_LAYER_ID, () => this.map.getCanvas().style.cursor = "pointer")
    this.map.on("mouseleave", CLUSTER_LAYER_ID, () => this.map.getCanvas().style.cursor = "")
  }

  center = (center: LngLatLike, zoom: number = 15, tree: boolean = false) => {
    this.zoomOnResults = !tree
    this.map.flyTo({ center, zoom, bearing: BEARING })
  }

  loadTrees = async (reCenter: boolean = true) => {
    window.Arbolado.setLoading(true)
    const trees = await window.Arbolado.dataSource.trees
    if (reCenter) {
      this.map.once("idle", () => this.zoomToFilteredResults(trees.features))
    }
    const source = this.map.getSource<GeoJSONSource>(SOURCE_ID)
    if (!source) {
      this.map.addSource(SOURCE_ID, {
        type: "geojson",
        data: trees,
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: 80
      })
    } else {
      source.setData(trees)
    }
    window.Arbolado.setLoading(false)
  }

  private zoomToFilteredResults = (features: any[]) => {
    if (!this.zoomOnResults) {
      this.zoomOnResults = true
      return
    }
    if (!features.length) return
    const bounds = new LngLatBounds()
    for (const feature of features) {
      bounds.extend(feature.geometry.coordinates as [number, number])
    }

    this.map.fitBounds(bounds, {
      padding: 60,
      maxZoom: CLUSTER_MAX_ZOOM,
      duration: 800,
      bearing: BEARING,
    })
  }

  private addLayers = async () => {
    // Cluster layer
    this.map.addLayer({
      id: CLUSTER_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": DEFAULTS.color,
        "circle-radius": [
          "step", ["get", "point_count"],
          16, 50,
          22, 200,
          28
        ]
      },
    })

    // Cluster count numbers layer
    this.map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12
      }
    })

    // Icon layer
    const species = window.Arbolado.species ?? []
    const icons: [number, string][] = species.filter(species => species.icono).map(species => [species.id!, species.icono!])
    this.iconImage = icons.length ? [
      "match",
      ["get", "species"],
      ...icons.flat(),
      DEFAULTS.icon,
    ] as unknown as ExpressionSpecification : DEFAULTS.icon

    // Load marker images
    const uniqueIcons = [...new Set(icons.map(icon => icon[1])), DEFAULTS.icon]
    await Promise.all(uniqueIcons.map(async (iconName) => {
      if (!iconName || this.map.hasImage(iconName)) return
      try {
        const image = await this.loadImage(`${ICON_PATH}${iconName}`)
        this.map.addImage(iconName, image)
      } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`, error)
      }
    }))

    this.map.addLayer({
      id: ICON_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": this.iconImage,
        "icon-size": 1,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    })
  }

  private init = async () => {
    try {
      this.map.once("idle", () => window.Arbolado.emitEvent(this, "arbolado:map/loaded"))
      await this.loadTrees()
      this.addLayers()
    } catch (err) {
      console.error(err)
    }
  }

  private loadImage = (path: string): Promise<HTMLImageElement | ImageBitmap | ImageData> => {
    return new Promise((resolve, reject) => {
      this.map.loadImage(path, (error, result) => {
        if (error) return reject(error)
        return resolve(result!)
      })
    })
  }
}