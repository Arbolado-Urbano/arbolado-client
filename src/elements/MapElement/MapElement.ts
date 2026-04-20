import * as L from 'leaflet'

import Supercluster from 'supercluster'

import MarkerPopupTemplate from './MarkerPopup.html?raw'

import { SEARCH_RADIUS } from '../../constants'

import Tree from '../../types/Tree'

import GeoBtn from '../GeoBtn/GeoBtn'

const environment = {
  highlightColor: '#5cba9d',
  mapDisableClusteringAt: 18,
  mapShowIconsAt: 17,
}

export default class MapElement extends HTMLElement {
  private geoBtn: GeoBtn
  private map: L.Map = L.map('map', { // Map options
    center: L.latLng(-34.618, -58.44), // BsAs
    layers: [
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 22
        },
      ),
    ],
    maxZoom: 22,
    minZoom: 5,
    zoom: 13,
    preferCanvas: true,
    renderer: L.canvas(),
  }) // Map reference
  private mapFitToBoundsOptions: L.FitBoundsOptions = { padding: [15, 15] } // To zoom into search results
  // private clusterOptions: L.MarkerClusterGroupOptions = {
  //   disableClusteringAtZoom: environment.mapDisableClusteringAt,
  //   maxClusterRadius: 100, // px
  //   polygonOptions: {
  //     color: environment.highlightColor,
  //     fillColor: environment.highlightColor,
  //     fillOpacity: 0.1,
  //     opacity: 1,
  //     weight: 1,
  //   },
  //   showCoverageOnHover: true,
  //   spiderfyDistanceMultiplier: 2,
  //   zoomToBoundsOnClick: true,
  // }
  private marker: L.Marker // Marker
  private circle: L.Circle // Circle around marker indicating search radius
  private trees: Tree[] = [] // Trees from search result
  private treesLayer: L.FeatureGroup = L.featureGroup() // Tree icons or dots layer
  private icons: Record<string, L.Icon> = {
    default: new L.Icon({
      iconAnchor: [15, 31],
      iconSize: [30, 34],
      iconUrl: `/imgs/markers/marker.png`,
    }),
  }

  constructor() {
    super()
    this.setMarker = this.setMarker.bind(this)
    const { marker, circle } = this.createMarker()
    this.marker = marker
    this.circle = circle
    this.geoBtn = document.querySelector('[js-map-geo-btn]') as GeoBtn
    this.geoBtn.addEventListener('arbolado:geo/searching', () => this.setLoading(true))
    this.geoBtn.addEventListener('arbolado:geo/error', () => this.setLoading(false))
    this.geoBtn.addEventListener('arbolado:geo/success', (event) => {
      this.setLoading(false)
      const data = (event as CustomEvent).detail
      const latLng = new L.LatLng(data.lat, data.lng)
      this.setMarker(latLng)
    })
    this.initMap()
    this.processURL()
  }

  private initMap() {
    this.map.addLayer(this.treesLayer)
    this.map.on('click', (event) => {
      this.setMarker(event.latlng)
    })
    this.map.on('moveend', () => {
      window.Arbolado.emitEvent(this, 'arbolado:map/move', { bounds: this.map.getBounds() })
      // Re-render the trees for the new map bounds
      this.renderTrees(false)
    })
  }

  private setLoading(loading: boolean) {
    if (loading) this.classList.add('loading')
    else this.classList.remove('loading')
  }

  private async processURL(): Promise<L.LatLng | undefined> {
    // Look for a location on the path
    const path = window.location.pathname.split('/')
    if (path[1] !== 'ubicacion') return undefined
    const ubicacion = path[2]
    if (ubicacion) {
      const results = await window.Arbolado.addressLookup(ubicacion)
      if (results[0]) {
        this.latlngUpdated(this.map, results[0].latlng)
      }
    }
    // Look for a marker on the query params. If there's one set it.
    const marker = window.Arbolado.queryParams.get('user_latlng')
    const radius = window.Arbolado.queryParams.get('radio')
    if (marker) {
      const markerLatLng = marker.split(' ')
      try {
        const latlng = new L.LatLng(Number(markerLatLng[0]), Number(markerLatLng[1]))
        this.setMarker(latlng, Number(radius))
      } catch {
        window.Arbolado.queryParams.delete('user_latlng')
        window.Arbolado.pushQueryParams()
      }
    }
  }

  /**
   * Displays the given tree on the map if there are no trees currently being displayed
   * @param tree - the tree to display
   */
  public displayTree(tree: Tree) {
    if (!this.treesLayer.getLayers().length) this.displayTrees([tree])
  }

  /**
   * Sets & displays the given trees on the map (discarding previous values)
   * @param trees - Array with the trees to display
   */
  public displayTrees(trees?: Tree[]): void {
    if ((!trees) || (typeof trees[Symbol.iterator] !== 'function')) return
    this.trees = trees
    this.marker?.closePopup() // Close the marker popup just in case it was open
    this.renderTrees(true)
  }

  /**
   * Renders the current trees on the map that are visible
   * @param center - Indicates if the map should be centered around the trees
   */
  public renderTrees(center: boolean): void {
    window.Arbolado.setLoading(true)
    // Remove all previous trees
    this.treesLayer.clearLayers()
    const mapZoom = this.map.getZoom()
    const mapBounds = this.map.getBounds()
    // Filter the trees that are out of the map bounds
    const filteredTrees = this.trees.filter(tree => mapBounds.contains({ lat: tree.lat, lng: tree.lng }))
    // Display dots while clustering is active
    if (mapZoom <= environment.mapDisableClusteringAt) {
      // Define the radius of the dots
      const radius = mapZoom > 16 ? 5 : 1
      // Generate the dots and the icons for each visible tree
      for (const tree of filteredTrees) {
        // Add a tree dot for the tree
        this.treesLayer.addLayer(
          L.circleMarker(tree, { radius, color: '#4f7663', fill: true, fillColor: '#4f7663', opacity: .5 })
        )
      }
    }
    // Generate the clusters
    let radius = 1500
    if (mapZoom > 18) radius = 100
    else if (mapZoom > 16) radius = 500
    const points: Supercluster.PointFeature<{ tree: Tree }>[] = filteredTrees.map(tree => ({ type: 'Feature', properties: { tree }, geometry: { type: 'Point', coordinates: [tree.lng, tree.lat] } }))
    const superCluster = new Supercluster<{ tree: Tree }>({ maxZoom: environment.mapDisableClusteringAt, radius })
    superCluster.load(points)
    const clusters = superCluster.getClusters([mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()], mapZoom)
    // Add each cluster and icon to the trees layer
    for (const cluster of clusters) {
      const [lng, lat] = cluster.geometry.coordinates
      if ('cluster' in cluster.properties) {
        const { point_count: pointCount, cluster_id: clusterId } = cluster.properties
        const size = pointCount < 10 ? 'small' : pointCount < 25 ? 'medium' : 'large'
        const clusterIcon = L.divIcon({
          html: `<div class="cluster-marker cluster-${size}">${pointCount}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
        const marker = L.marker([lat, lng], { icon: clusterIcon }).on('click', () => {
          // Zoom to cluster bounds on click
          const expansionZoom = superCluster.getClusterExpansionZoom(clusterId)
          this.map.setView([lat, lng], expansionZoom)
        })
        this.treesLayer.addLayer(marker)
      } else {
        const { tree } = cluster.properties
        // Select the tree's icon or use the default if none
        let icon = this.icons.default
        if (tree.species.icono) {
          if (!this.icons[tree.species.icono]) {
            this.icons[tree.species.icono] = new L.Icon({
              iconAnchor: [15, 31],
              iconSize: [30, 34],
              iconUrl: `/imgs/markers/${tree.species.icono}`,
            })
          }
          icon = this.icons[tree.species.icono]
        }
        // Add a tree icon for the tree
        this.treesLayer.addLayer(
          new L.Marker([tree.lat, tree.lng], { icon }).on('click', () => {
            this.selectTree(tree.id) // When the marker is clicked => select it
          })
        )
      }
    }
    // Center the map on the results
    if ((center) && (this.treesLayer.getLayers().length)) {
      this.map.fitBounds(this.treesLayer.getBounds(), this.mapFitToBoundsOptions)
    }
    window.Arbolado.setLoading(false)
  }

  /**
   * Removes the search marker and it's "search radius" circle from the map
   */
  public removeMarker(): void {
    this.map.removeLayer(this.marker)
    this.map.removeLayer(this.circle)
  }

  /**
   * Emits an event with the passed latlng value and re-centers the map around those coordinates
   * @param map - The map object
   * @param latLng - The latlng coordinates
   */
  private latlngUpdated(map: L.Map, latLng: L.LatLng): void {
    // Emit the new marker coordinates
    window.Arbolado.emitEvent(this, 'arbolado:maker/set', { latLng })
    // Re-center the map around the marker
    map.panTo(latLng)
  }

  private createMarkerPopup() {
    const markerPopupContent = window.Arbolado.loadTemplate(MarkerPopupTemplate) as HTMLElement
    markerPopupContent.querySelector('[js-marker-popup-search]')?.addEventListener('click', () => {
      this.marker.closePopup()
      // Emit an event when the user clicks the search button from marker so the search form can be notified and perform the search
      window.Arbolado.emitEvent(this, 'arbolado:marker/search')
    })
    markerPopupContent.querySelector('[js-marker-popup-clear]')?.addEventListener('click', () => {
      this.removeMarker()
      // Emit an event when the user clears the map marker so the search form can be notified and update its UI
      window.Arbolado.emitEvent(this, 'arbolado:marker/removed')
    })
    return markerPopupContent
  }

  private createMarker() {
    L.Icon.Default.imagePath = '/imgs/markers/'
    // Create a new marker
    const marker = new L.Marker([0, 0], {
      draggable: true,
      riseOnHover: true,
    })
    // Create a circle around it to show the search radius
    const circle = new L.Circle(
      [0, 0],
      {
        radius: 0,
        color: '#000',
        fillColor: '#ddd',
        fillOpacity: 0.3,
      },
    )
    // When the marker is dragged move the circle to it
    marker.on('dragend', (dragEvent) => {
      const newLatlng = dragEvent.target.getLatLng()
      circle.setLatLng(newLatlng)
      // Update the selected coordinates
      this.latlngUpdated(this.map, newLatlng)
      this.marker.openPopup()
    })
    marker.bindPopup("")
    // Create new popup content whenever it opens otherwise we get an empty popup.
    // This is due to how we create the content using a template and cloning it.
    // We need to do this to be able to set event listeners on the buttons inside of it.
    marker.on("popupopen", () => marker.setPopupContent(this.createMarkerPopup()))
    return { marker, circle }
  }

  /**
   * Sets a marker on the map based on coordinates
   * @param latLng - Latitude and longitude coordinates
   */
  public setMarker(latLng: L.LatLng, radius: number = SEARCH_RADIUS): void {
    // Move the marker and its circle
    this.marker.setLatLng([latLng.lat, latLng.lng])
    this.circle.setRadius(radius)
    this.circle.setLatLng([latLng.lat, latLng.lng])

    if (!this.map.hasLayer(this.marker)) {
      this.map.addLayer(this.marker)
      this.map.addLayer(this.circle)
    }

    // Update the selected coordinates
    this.latlngUpdated(this.map, latLng)

    // Close and re-open the popup to force it to refresh its content just in case
    this.marker.closePopup()
    this.marker.openPopup()
  }

  /**
   * Emits an event with the id of a tree
   * @param id - ID to emit
   */
  public selectTree(id: number): void {
    // Emit the selected tree's ID
    window.Arbolado.emitEvent(this, 'arbolado:tree/selected', { id })
  }
}