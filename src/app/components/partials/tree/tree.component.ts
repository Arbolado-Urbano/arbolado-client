import { ChangeDetectorRef, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { faFacebookF, faFacebookSquare, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faLink, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

import { environment } from '../../../../environments/environment';

import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-tree',
  styleUrls: ['./tree.component.scss'],
  templateUrl: './tree.component.html',
})
export class TreeComponent {
  private streetviewUrl = `${environment.googleMapsStreetViewUrl}&key=${environment.googleMapsAPIKey}`;
  public tree; // Selected tree's info
  public display = false; // Display or hide the tree panel
  public icons = { // Fontawesome icons
    faExternalLinkAlt,
    faFacebookF,
    faFacebookSquare,
    faInstagram,
    faLink,
    faMapMarkerAlt,
    faTwitter,
  };

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
  ) { }

  /**
   * Closes the tree panel
   */
  public closePanel(): void {
    // Hide the tree panel
    this.display = false;

    // Needed for the display = false change to be detected
    // https://stackoverflow.com/a/40759857/3780276
    this.cdRef.detectChanges();
  }

  /**
   * Displays a tree's information
   * @param treeId - ID of the tree to display
   */
  public displayTree(treeId: number): void {
    // Get the tree's info
    this.apiService.getTree(treeId).subscribe((tree) => {
      // If there's no streetview URL for the tree, use its coordinates
      if (!tree.streetview) {
        tree.streetview = `${this.streetviewUrl}&location=${tree.lat},${tree.lng}`;
      }

      // Sanitize the streetview URL
      tree.streetview = this.sanitizer.bypassSecurityTrustResourceUrl(tree.streetview);

      // Set the tree
      this.tree = tree;

      // Display the tree panel
      this.display = true;

      // Needed for the display = true change to be detected
      // https://stackoverflow.com/a/40759857/3780276
      this.cdRef.detectChanges();
    });
  }
}
