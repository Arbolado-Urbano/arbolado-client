import { ExpressionSpecification, GeoJSONSource, Map as MapboxMap } from "mapbox-gl"
import { Database, STORE_KEYS, STORE_NAMES } from "./Database"

import { DEFAULTS, ICON_PATH } from "./constants/speciesStyles"

import { Filters } from "./types/Filters"
import { GeoJSONTrees, Trees } from "./types/Tree"

type TreeMap = Map<number, Trees[number]>

const SYNC_INTERVAL = 900000 // 15 minutes

export class Datasource {
  private iconImage?: ExpressionSpecification | string
  private _filters: Filters = {}
  private _allTrees?: Promise<TreeMap>
  private lastSync?: string
  private intervalId?: number

  /**
   * Returns the current tree filters.
   * 
   * @return Filters object.
   */
  get filters() {
    return this._filters
  }

  /**
   * Sets the tree filters and triggers the `arbolado:search` global event.
   */
  set filters(filters: Filters) {
    this._filters = filters
    window.Arbolado.emitEvent(document, 'arbolado:search', { filters })
  }

  /**
   * Returns a GeoJSON with a filtered tree list.
   * 
   * @param filters - Filters to apply. Defaults to the current filters (this.filters).
   * @return Promise that resolves a GeoJSON with all the filtered trees.
   */
  private getTrees = async (filters: Filters = this.filters) => {
    let result: GeoJSONTrees = { features: [], type: "FeatureCollection" }
    if (filters.sourceUrl) {
      const response = await window.Arbolado.fetchAPI(`/fuentes/${filters.sourceUrl}`)
      if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
      const trees: Trees = await response.json()
      result.features = trees.map(this.treeToGeoJSONFeature)
    } else {
      const species = window.Arbolado.species?.filter(species => {
        if (!species.url) return false
        if (filters.speciesUrl) {
          if (species.url !== filters.speciesUrl) return false
        }
        if (filters.flavors) {
          if (species.comestible !== 'Sí' && species.medicinal !== 'Sí') return false
        }
        return true
      }).map(species => species.id) ?? []
      result.features = Array.from((await this.allTrees()).values()).map(this.treeToGeoJSONFeature)
      if (filters.flavors || filters.speciesUrl) {
        result.features = result.features.filter(feature => {
          if (species?.indexOf(feature.properties.species) === -1) return false
          return true
        })
      }
    }
    return result
  }

  /**
   * Stores a list of trees in the IndexedDB and the "lastSync" date.
   * Deleted trees won't get stored.
   * Replaces what was previously stored.
   * 
   * @param trees - List of trees to store.
   * @param lastSync - Last synchronization date string.
   */
  private storeData = async (trees: TreeMap, lastSync?: string | null) => {
    Database.put(STORE_NAMES.trees, trees, STORE_KEYS.trees.all)
    // Update lastSync value after trees have been stored
    if (lastSync) {
      await Database.put(STORE_NAMES.meta, lastSync, STORE_KEYS.meta.lastSync)
      this.lastSync = lastSync
    }
  }

  /**
   * Returns a map with all the trees.
   * 
   * @return TreeMap with all the trees.
   */
  private allTrees = (): Promise<TreeMap> => {
    // Check if we have all trees already loaded in memory
    // Cache the promise so concurrent callers share a single load
    this._allTrees ??= this.loadAllTrees()
    return this._allTrees
  }

  /**
   * Loads all the trees from the IndexedDB, or from the API if the DB is empty.
   * Also starts the periodic sync of new trees.
   *
   * @return TreeMap with all the trees.
   */
  private loadAllTrees = async (): Promise<TreeMap> => {
    try {
      this.lastSync = await Database.get<string>(STORE_NAMES.meta, STORE_KEYS.meta.lastSync)
    } catch (error) {
      console.error(error)
    }
    // Check for "lastSync" instead of "result" beacuse tree list may be there but incomplete
    // "lastSync" gets stored after the tree list has been successfully stored
    let result: TreeMap = new Map()
    if (this.lastSync === undefined) {
      // If the IndexedDB is empty get the trees from the API
      const response = await window.Arbolado.fetchAPI('/arboles')
      if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
      const trees: Trees = await response.json()
      // Remove "deleted" trees from the response
      const fitleredTrees = trees.filter(tree => tree.deleted === null)
      // Set each tree into the "result" map
      fitleredTrees.forEach(tree => result.set(tree.id, tree))
      // Store the trees' map in the IndexedDB
      try {
        this.storeData(result, response.headers.get("last-modified"))
      } catch (error) {
        // We don't want this error to prevent the map from loading.
        // We do have data to show, the failure was just when storing it in the DB.
        console.error(error)
      }
    } else {
      // If the IndexedDB has data get the trees from it
      try {
        const storedValue = await Database.get<TreeMap>(STORE_NAMES.trees, STORE_KEYS.trees.all)
        if (storedValue) {
          result = storedValue
        }
        this.syncNewTrees()
      } catch (error) {
        console.error(error)
        window.Arbolado.alert("danger", "Ocurrió un error al cargar el listado de árboles. Intente nuevamente")
      }
    }
    if (this.intervalId === undefined) {
      // Check for updates every 15 minutes
      this.intervalId = setInterval(this.syncNewTrees, SYNC_INTERVAL)
    }
    // Store the trees in memory as a Map for easily merging in new updates
    return result
  }

  /**
   * Gets new trees from the API.
   * Updates the IndexDB store with the new changes.
   * Emits a "arbolado:trees/update" event.
   */
  public syncNewTrees = async (): Promise<void> => {
    try {
      const lastSync = await Database.get<string>(STORE_NAMES.meta, STORE_KEYS.meta.lastSync)
      const path = lastSync ? `/arboles?fecha=${encodeURIComponent(lastSync)}` : "/arboles"
      const response = await window.Arbolado.fetchAPI(path, { loadingIndicator: false })
      if (!response.ok) throw new Error('Error al consultar la API: ' + response?.status)
      const trees: Trees = await response.json()
      if (trees.length > 0) {
        const allTrees = await this.allTrees()
        trees.forEach(tree => {
          if (tree.deleted !== null) {
            allTrees.delete(tree.id)
          } else {
            allTrees.set(tree.id, tree)
          }
        })
        this.storeData(allTrees, response.headers.get("last-modified"))
        window.Arbolado.emitEvent(document, "arbolado:trees/update")
      }
    } catch (error) {
      console.error(error)
      window.Arbolado.alert("danger", "Ocurrió un error al actualizar el listado de árboles. Intente nuevamente")
    }
  }

  /**
   * Converts a tree from a Trees to a GeoJSON feature.
   * 
   * @param tree - Tree to convert.
   * @return GeoJSON feature representing the given tree.
   */
  private treeToGeoJSONFeature = (tree: Trees[number]): GeoJSONTrees["features"][number] => {
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

  public loadTrees = async (map: MapboxMap, sourceId: string, clusterMaxZoom: number, filters: Filters = this.filters) => {
    window.Arbolado.setLoading(true)
    const trees = await this.getTrees(filters)
    const source = map.getSource<GeoJSONSource>(sourceId)
    if (!source) {
      map.addSource(sourceId, {
        type: "geojson",
        data: trees,
        cluster: true,
        clusterMaxZoom,
        clusterRadius: 80
      })
    } else {
      source.setData(trees)
    }
    window.Arbolado.setLoading(false)
    return trees
  }

  public addLayers = async (map: MapboxMap, sourceId: string, clusterLayerId: string, clusterCountLayerId: string, iconLayerId: string) => {
    // Cluster layer
    map.addLayer({
      id: clusterLayerId,
      type: "circle",
      source: sourceId,
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
    map.addLayer({
      id: clusterCountLayerId,
      type: "symbol",
      source: sourceId,
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
      if (!iconName || map.hasImage(iconName)) return
      try {
        const image = await this.loadImage(map, `${ICON_PATH}${iconName}`)
        map.addImage(iconName, image)
      } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`, error)
      }
    }))

    map.addLayer({
      id: iconLayerId,
      type: "symbol",
      source: sourceId,
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

  private loadImage = (map: MapboxMap, path: string): Promise<HTMLImageElement | ImageBitmap | ImageData> => {
    return new Promise((resolve, reject) => {
      map.loadImage(path, (error, result) => {
        if (error) return reject(error)
        return resolve(result!)
      })
    })
  }
}