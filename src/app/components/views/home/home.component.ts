import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faChevronUp, faPlusSquare, faSearch } from '@fortawesome/free-solid-svg-icons';

import { LatLng } from 'leaflet';

import { NominatimService } from '../../../services/nominatim.service';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('aboutModal') private aboutModal;
  @ViewChild('emptyTreesModal') private emptyTreesModal;
  @ViewChild('addTreeModal') private addTreeModal;
  @ViewChild('tree') private treeComponent;
  @ViewChild('map') private mapComponent;
  @ViewChild('form') private formComponent;
  @ViewChild('main', { read: ElementRef }) private mainElement;
  public addressSearch = '';
  public addressResults = [];
  public addressSearching = false;
  public species = []; // System species
  public latlng: LatLng; // Selected latitude and longitude
  public adClient = environment.adsenseClient; // Adsense
  public adSlot = environment.adsenseSlot; // Adsense
  public icons = { // Fontawesome icons
    faChevronUp,
    faFacebook,
    faPlusSquare,
    faSearch,
  };

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private nominatimService: NominatimService,
  ) {
    this.titleService.setTitle('Arbolado Urbano');
    this.species = this.route.snapshot.data.species;
  }

  public ngAfterViewInit(): void {
    const tree = this.route.snapshot.data.tree;
    console.log(tree);
    if (tree) {
      this.treeComponent.displayTree(tree);
    }
  }

  /**
   * Displays the "about" modal
   */
  public displayAboutModal(): void {
    this.aboutModal.display();
  }

  /**
   * Displays the "add tree" modal
   */
  public displayAddTreeModal(): void {
    this.addTreeModal.display();
  }

  /**
   * Update's the selected latlng
   */
  public updateLatlng(latlng: LatLng): void {
    this.latlng = latlng;
  }

  /**
   * Updates the trees to display
   */
  public updateTrees(trees: any[]): void {
    if (!trees.length) {
      // If there are no trees to display show an info modal with some help
      this.emptyTreesModal.display();
    }

    // Display the trees on the map
    this.mapComponent.displayTrees(trees);
    // Scroll the map into view
    this.scrollTo(this.mainElement.nativeElement);
  }

  /**
   * Sets the map marker
   */
  public setMarker(latlng: LatLng): void {
    this.mapComponent.setMarker(latlng);
  }

  /**
   * Removes the map marker
   */
  public removeMarker(): void {
    this.mapComponent.removeMarker();
  }

  /**
   * Updates the selected tree
   */
  public updateTree(treeId): void {
    this.treeComponent.loadTree(treeId);
  }

  /**
   * Scrolls an element into view
   * @param element - Element to scroll to
   */
  public scrollTo(element: any): void {
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Selects a given address from the addressResults and places a marker on it
   * @param i - Index of the selected address in the addressResults array
   */
  public selectAddress(i: number): void {
    this.setMarker(this.addressResults[i].latlng); // Place a marker on the address
    this.addressSearch = this.addressResults[i].displayName; // Copy the name to the input field
    this.addressResults = []; // Empty the results
  }

  /**
   * Looks for an address or place
   */
  public addressLookup(event): void {
    // If keypressed was "Intro" or it's a "click" event & there's an input
    if (((event.type === 'click') || (event.keyCode === 13)) && (this.addressSearch)) {
      this.addressSearching = true; // Display the loading indicator
      const bounds = this.mapComponent.getMapBounds(); // Get the current map bounds
      // Search withing the map bounds
      this.nominatimService.addressLookup(this.addressSearch, bounds).subscribe(
        (results) => {
          this.addressResults = results; // Load the search results
          this.addressSearching = false; // Hide the loading indicator
        },
      );
    }
  }

}
