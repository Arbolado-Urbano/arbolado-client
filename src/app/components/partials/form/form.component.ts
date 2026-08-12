import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

import { environment } from '../../../../environments/environment';

import { LatLng } from 'leaflet';

@Component({
  selector: 'app-form',
  styleUrls: ['./form.component.scss'],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnChanges, OnInit, AfterViewInit {
  // Event emitter for when the search results have been loaded
  @Output() public treesLoaded: EventEmitter<any[]> = new EventEmitter();
  // Event emitter for when the user wants to remove the map marker
  @Output() public allMapSelected: EventEmitter<L.LatLng> = new EventEmitter();
  @Input() public species: any[]; // List of species for the select element
  @Input() public latlng: LatLng; // Selected latlng for the search
  public isCollapsed = true; // Indicates if the "more filters" section is collapsed
  public validated = false; // Indicates if the form has been validated
  public form: FormGroup; // Search form
  public popoverText = 'Para buscar, empezá marcando un punto en el mapa. O podés buscar en toda la ciudad si seleccionás alguna especie.';
  public popoverTitle = 'Opa, ¡esos son muchos árboles!';
  public popoverOpen = false;
  public icons = { // Fontawesome icons
    faTrashAlt,
  };

  constructor(private router: Router, private route: ActivatedRoute) {}

  public ngOnInit(): void {
    const flavors = this.route.snapshot.queryParamMap.get('user_sabores');
    const marker = this.route.snapshot.queryParamMap.get('user_latlng');
    const origin = this.route.snapshot.queryParamMap.get('user_origen');
    const cuyana = this.route.snapshot.queryParamMap.get('borigen_cuyana');
    const nea = this.route.snapshot.queryParamMap.get('borigen_nea');
    const noa = this.route.snapshot.queryParamMap.get('borigen_noa');
    const pampeana = this.route.snapshot.queryParamMap.get('borigen_pampeana');
    const patagonica = this.route.snapshot.queryParamMap.get('borigen_patagonica');
    const species = this.route.snapshot.queryParamMap.get('especie_id');

    this.form = new FormGroup({
      flavors: new FormControl(flavors),
      marker: new FormControl(marker ? marker : ''),
      origin: new FormControl(origin),
      region: new FormGroup({
        cuyana: new FormControl(cuyana),
        nea: new FormControl(nea),
        noa: new FormControl(noa),
        pampeana: new FormControl(pampeana),
        patagonica: new FormControl(patagonica),
      }),
      species: new FormControl(species ? Number(species) : ''),
    });

    // When the marker FormControl is set to "0" => emit an event indicating this
    this.form.controls.marker.valueChanges.subscribe((value) => {
      if (value === '') {
        this.allMapSelected.emit();
      }
    });
  }

  public ngAfterViewInit(): void {
    this.route.data.subscribe((data) => {
      if (data.trees) {
        this.treesLoaded.emit(data.trees);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.latlng) {
      if (this.latlng) {
        // If a latlng has been selected => update the "marker" FormControl value
        this.form.controls.marker.setValue('1');
      }
    }

    if (changes.species) {
      if (this.species) {
        // If the species have been loaded => add a value for "all" species
        this.species.unshift({
          id: '',
          nombre_cientifico: 'Todas',
        });
      }
    }
  }

  /**
   * Resets the "origin" FormControl value
   */
  public cleanOrigin(): void {
    this.form.controls.origin.reset('');
  }

  /**
   * Performs a tree search with the selected filters
   */
  public search(): void {
    // If the form is not valid => return
    if (this.form.invalid) {
      this.validated = true;
      return;
    }

    // Reset info message status
    this.popoverOpen = false;

    // Get the form data and set the selected latlng if any
    const data = this.form.value;
    if (data.marker === '1') {
      data.marker = `${this.latlng.lat} ${this.latlng.lng}`;
    } else if ((!data.species) && (data.marker === '')) {
      // If there's no marker and no species selected =>
      // Don't search, display info message instead
      this.popoverOpen = true;
      return;
    }

    // Set the filters
    const navigationExtras: NavigationExtras = {
      queryParams: {
        user_sabores: data.flavors ? data.flavors : undefined,
        user_latlng: data.marker ? data.marker : undefined,
        user_origen: data.origin ? data.origin : undefined,
        borigen_cuyana: data.region.cuyana ? data.region.cuyana : undefined,
        borigen_nea: data.region.nea ? data.region.nea : undefined,
        borigen_noa: data.region.noa ? data.region.noa : undefined,
        borigen_pampeana: data.region.pampeana ? data.region.pampeana : undefined,
        borigen_patagonica: data.region.patagonica ? data.region.patagonica : undefined,
        especie_id: data.species ? data.species : undefined,
        radio: data.marker ? environment.searchRadius.toString() : undefined,
      },
    };

    // Navigate to the results page
    this.router.navigate(['/buscar'], navigationExtras);
  }
}
