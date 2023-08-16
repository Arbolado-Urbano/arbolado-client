import * as L from 'leaflet'
import 'leaflet.markercluster'

const environment = {
  highlightColor: '#5cba9d',
  mapDisableClusteringAt: 21,
  mapboxToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
  searchRadius: 1000,
}

export default class MapElement extends HTMLElement {
  public map: L.Map // Map reference
  public mapFitToBoundsOptions: L.FitBoundsOptions = { maxZoom: 15, padding: [15, 15] } // To zoom into search results
  public options: L.MapOptions = { // Map options
    center: L.latLng(-34.618, -58.44), // BsAs
    layers: [
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          accessToken: environment.mapboxToken,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 21,
          tileSize: 512,
          zoomOffset: -1,
        },
      ),
    ],
    maxZoom: 21,
    minZoom: 5,
    zoom: 12,
  }
  public clusterOptions = {
    disableClusteringAtZoom: environment.mapDisableClusteringAt,
    maxClusterRadius: 100, // px
    polygonOptions: {
      color: environment.highlightColor,
      fillColor: environment.highlightColor,
      fillOpacity: 0.1,
      opacity: 1,
      weight: 1,
    },
    showCoverageOnHover: true,
    spiderfyDistanceMultiplier: 2,
    zoomToBoundsOnClick: true,
  }
  public marker?: L.Marker // Marker
  public circle?: L.Circle // Circle around marker indicating search radius
  public treeMarkers: L.MarkerClusterGroup // Trees from search result
  private icons: { [key: string]: L.Icon } = {
    default: new L.Icon({
      iconAnchor: [15, 31],
      iconSize: [30, 34],
      iconUrl: `/imgs/markers/marker.png`,
    }),
  }

  constructor() {
    super()
    this.treeMarkers = L.markerClusterGroup(this.clusterOptions)
    this.map = L.map('map', this.options)
    this.map.addLayer(this.treeMarkers)
    this.map.on('click', (event: any) => {
      this.setMarker(event.latlng)
    })

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
   * Returns the current bounds of the map
   */
  public getMapBounds(): L.LatLngBounds {
    return this.map.getBounds()
  }
  
  /**
   * Displays the given trees on the map (discarding previous values)
   * @param trees - Array with the trees to display info
   */
  public displayTrees(trees: any[]): void {
    this.treeMarkers.clearLayers() // Remove all previous trees
    for (const tree of trees) {
      // Select the tree's icon or use the default if none
      let icon = this.icons.default
      if (tree.icono) {
        if (!this.icons[tree.icono]) {
          this.icons[tree.icono] = new L.Icon({
            iconAnchor: [15, 31],
            iconSize: [30, 34],
            iconUrl: `/imgs/markers/${tree.icono}`,
          })
        }
        icon = this.icons[tree.icono]
      }
      // Add a tree marker for the tree to the treeMarkers
      this.treeMarkers.addLayer(
        new L.Marker([tree.lat, tree.lng], { icon }).on('click', () => {
          this.selectTree(tree.id) // When the marker is clicked => select it
        })
      )
    }

    // Center the map on the results
    if ((this.map) && (this.treeMarkers.getLayers().length)) {
      this.map.fitBounds(this.treeMarkers.getBounds(), this.mapFitToBoundsOptions)
    }
  }

  /**
   * Removes the search marker and it's "search radius" circle from the map
   */
  public removeMarker(): void {
    if (this.marker) this.map.removeLayer(this.marker)
    if (this.circle) this.map.removeLayer(this.circle)
  }

  /**
   * Emits an event with the passed latlng value and re-centers the map around those coordinates
   * @param map - The map object
   * @param latLng - The latlng coordinates
   */
  private latlngUpdated(map: L.Map, latLng: L.LatLng): void {
    // Emit the new marker coordinates
    window.Arbolado.emitEvent(this, 'arbolado/maker:set', { latLng })
    // Re-center the map around the marker
    map.panTo(latLng)
  }

  /**
   * Sets a marker on the map based on coordinates
   * @param latLng - Latitude and longitude coordinates
   */
  public setMarker(latLng: L.LatLng, radius: number = environment.searchRadius): void {
    // Get the map object
    if (this.map) {
      // If there's no marker on the map...
      if (!this.marker) {
        L.Icon.Default.imagePath = '/imgs/markers/'
        // Create a new marker
        this.marker = new L.Marker([latLng.lat, latLng.lng], {
          draggable: true,
          riseOnHover: true,
        })
        this.map.addLayer(this.marker)

        // Create a circle around it to show the search radius
        this.circle = new L.Circle(
          [latLng.lat, latLng.lng],
          {
            radius,
            color: '#000',
            fillColor: '#ddd',
            fillOpacity: 0.3,
          },
        )
        this.map.addLayer(this.circle)

        // When the marker is dragged move the circle to it
        this.marker.on('dragend', (dragEvent) => {
          const newLatlng = dragEvent.target.getLatLng()
          this.circle?.setLatLng(newLatlng)
          // Update the selected coordinates
          this.latlngUpdated(this.map, newLatlng)
        })
      } else {
        // If a marker already exists, move it and its circle
        this.marker.setLatLng([latLng.lat, latLng.lng])
        this.circle?.setLatLng([latLng.lat, latLng.lng])
      }

      if (!this.map.hasLayer(this.marker)) {
        this.map.addLayer(this.marker)
        if (this.circle) this.map.addLayer(this.circle)
      }

      // Update the selected coordinates
      this.latlngUpdated(this.map, latLng)
    }
  }

  /**
   * Emits an event with the id of a tree
   * @param id - ID to emit
   */
  public selectTree(id: string): void {
    // Emit the selected tree's ID
    window.Arbolado.emitEvent(this, 'arbolado/tree:selected', { id })
  }
}