import { Component, EventEmitter, Output, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-map',
  styleUrls: ['./map.component.scss'],
  templateUrl: './map.component.html',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  // Event emitter for when the user sets or resets a marker on the map
  @Output() public markerSet: EventEmitter<L.LatLng> = new EventEmitter();
  // Event emitter for when the user clicks on a tree
  @Output() public treeSelected: EventEmitter<L.LatLng> = new EventEmitter();
  public map: L.Map; // Map reference
  public mapFitToBoundsOptions: L.FitBoundsOptions = { maxZoom: 15, padding: [15, 15] }; // To zoom into search results
  public options: L.MapOptions = { // Map options
    center: L.latLng(-34.618, -58.44), // BsAs
    layers: [
      L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
          accessToken: environment.mapboxToken,
          attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
          id: 'mapbox/streets-v11',
          maxZoom: 21,
          tileSize: 512,
          zoomOffset: -1,
        },
      ),
    ],
    maxZoom: 21,
    minZoom: 5,
    zoom: 12,
  };
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
  };
  public marker: L.Marker; // Marker
  public circle: L.Circle; // Circle around marker indicating search radius
  public treeMarkers: L.MarkerClusterGroup; // Trees from search result
  private icons = {
    default: new L.Icon({
      iconAnchor: [15, 31],
      iconSize: [30, 34],
      iconUrl: `assets/imgs/markers/marker.png`,
    }),
  };

  constructor(private route: ActivatedRoute) {
    this.treeMarkers = L.markerClusterGroup(this.clusterOptions);
  }

  public ngAfterViewInit(): void {
    // setTimeout used to prevent the map from not loading when navigation happens
    setTimeout(() => {
      this.map = L.map('map', this.options);
      this.map.addLayer(this.treeMarkers);
      this.map.on('click', (event: any) => {
        this.setMarker(event.latlng);
      });
    }, 500);
  }

  public ngOnDestroy(): void {
    this.map.remove();
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
      let icon = this.icons.default;
      if (tree.icono) {
        if (!this.icons[tree.icono]) {
          this.icons[tree.icono] = new L.Icon({
            iconAnchor: [15, 31],
            iconSize: [30, 34],
            iconUrl: `assets/imgs/markers/${tree.icono}`,
          });
        }
        icon = this.icons[tree.icono];
      }
      // Add a tree marker for the tree to the treeMarkers
      this.treeMarkers.addLayer(
        new L.Marker([tree.lat, tree.lng], { icon }).on('click', () => {
          this.selectTree(tree.id); // When the marker is clicked => select it
        })
      );
    }

    // Center the map on the results
    if ((this.map) && (this.treeMarkers.getLayers().length)) {
      this.map.fitBounds(this.treeMarkers.getBounds(), this.mapFitToBoundsOptions);
    }
  }

  /**
   * Removes the search marker and it's "search radius" circle from the map
   */
  public removeMarker(): void {
    this.map.removeLayer(this.marker);
    this.map.removeLayer(this.circle);
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
   * Sets a marker on the map based on coordinates
   * @param latlng - Latitude and longitude coordinates
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
        this.map.addLayer(this.marker);

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
        this.map.addLayer(this.circle);

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

      if (!this.map.hasLayer(this.marker)) {
        this.map.addLayer(this.marker);
        this.map.addLayer(this.circle);
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
