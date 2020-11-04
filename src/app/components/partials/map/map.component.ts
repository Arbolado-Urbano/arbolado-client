import { Component, EventEmitter, Output } from '@angular/core';

import * as L from 'leaflet';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-map',
  styleUrls: ['./map.component.scss'],
  templateUrl: './map.component.html',
})
export class MapComponent {
  // Event emitter for when the user sets or resets a marker on the map
  @Output() public markerSet: EventEmitter<L.LatLng> = new EventEmitter();
  // Event emitter for when the user clicks on a tree
  @Output() public treeSelected: EventEmitter<L.LatLng> = new EventEmitter();
  public map: L.Map; // Map reference
  public layers = []; // Map layers
  public mapFitToBounds: L.LatLngBounds; // To zoom into search results
  public mapFitToBoundsOptions: L.FitBoundsOptions = { maxZoom: 15, animate: true }; // To zoom into search results
  public options = { // Map options
    center: [-34.618, -58.44], // BsAs
    clusterOptions: {
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
    },
    layers: [
      L.tileLayer(
        `https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=${environment.mapboxToken}`,
        {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="http://mapbox.com">Mapbox</a>',
          maxZoom: 21,
        },
      ),
    ],
    maxZoom: 21,
    minZoom: 5,
    zoom: 12,
  };
  public marker: L.Marker; // Marker
  public circle: L.Circle; // Circle around marker indicating search radius
  public treeMarkers: L.FeatureGroup = L.featureGroup(); // Trees from search result
  private defaultIcon: L.Icon; // Default tree icon

  constructor() {
    this.defaultIcon = new L.Icon({
      iconAnchor: [15, 31],
      iconSize: [30, 34],
      iconUrl: `assets/imgs/markers/marker.png`,
    });
  }

  /**
   * Stores a reference of the Leaflet map
   * @param map - Reference to the Leaflet map
   */
  public onMapReady(map: L.Map): void {
    this.map = map;
  }

  /**
   * Returns the current bounds of the map
   */
   public getMapBounds(): L.LatLngBounds {
    return this.map ? this.map.getBounds() : undefined;
  }

  /**
   * Displays the given trees on the map (discarding previous values)
   * @param trees - Array with the trees to display info
   */
  public displayTrees(trees: any[]): void {
    this.treeMarkers.clearLayers(); // Remove all previous trees
    for (const tree of trees) {
      // Select the tree's icon or use the default if none
      let icon = this.defaultIcon;
      if (tree.icono) {
        icon = new L.Icon({
          iconAnchor: [15, 31],
          iconSize: [30, 34],
          iconUrl: `assets/imgs/markers/${tree.icono}`,
        });
      }
      // Add a tree marker for the tree to the treeMarkers
      this.treeMarkers.addLayer(
        new L.Marker([tree.lat, tree.lng], { icon }).on('click', () => {
          this.selectTree(tree.id); // When the marker is clicked => select it
        }),
      );
    }

    // Center the map on the results
    if ((this.map) && (this.treeMarkers.getLayers().length)) {
      this.mapFitToBounds = this.treeMarkers.getBounds();
    }
  }

  /**
   * Removes the search marker and it's "search radius" circle from the map
   */
  public removeMarker(): void {
    this.layers = [];
    delete this.marker;
    delete this.circle;
  }

  /**
   * Emits an event with the passed latlng value and re-centers the map around those coordinates
   * @param map - The map object
   * @param latlng - The latlng coordinates
   */
  private latlngUpdated(map, latlng: L.LatLng): void {
    // Emit the new marker coordinates
    this.markerSet.emit(latlng);
    // Re-center the map around the marker
    map.panTo(latlng);
  }

  /**
   * Sets a marker on the map based on a click event coordinates
   * @param event - Click event
   */
  public setMarker(latlng: L.LatLng): void {
    // Get the map object
    if (this.map) {
      // If there's no marker on the map...
      if (!this.marker) {
        L.Icon.Default.imagePath = 'assets/imgs/markers/';
        // Create a new marker
        this.marker = new L.Marker([latlng.lat, latlng.lng], {
          draggable: true,
          riseOnHover: true,
        });
        this.layers.push(this.marker);

        // Create a circle around it to show the search radius
        this.circle = new L.Circle(
          [latlng.lat, latlng.lng],
          environment.searchRadius,
          {
            color: '#000',
            fillColor: '#ddd',
            fillOpacity: 0.3,
          },
        );
        this.layers.push(this.circle);

        // When the marker is dragged move the circle to it
        this.marker.on('dragend', (dragEvent) => {
          const newLatlng = dragEvent.target.getLatLng();
          this.circle.setLatLng(newLatlng);
          // Update the selected coordinates
          this.latlngUpdated(this.map, newLatlng);
        });
      } else {
        // If a marker already exists, move it and its circle
        this.marker.setLatLng([latlng.lat, latlng.lng]);
        this.circle.setLatLng([latlng.lat, latlng.lng]);
      }

      // Update the selected coordinates
      this.latlngUpdated(this.map, latlng);
    }
  }

  /**
   * Emits an event with the id of a tree
   * @param id - ID to emit
   */
  public selectTree(id): void {
    // Emit the selected tree's ID
    this.treeSelected.emit(id);
  }

}
