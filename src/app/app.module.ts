import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { HomeComponent } from './components/views/home/home.component';

// Form components
import { SpeciesSelectComponent } from './components/form-controls/species-select/species-select.component';

// Partial components
import { FormComponent } from './components/partials/form/form.component';
import { LoaderComponent } from './components/partials/loader/loader.component';
import { MapComponent } from './components/partials/map/map.component';
import { TreeComponent } from './components/partials/tree/tree.component';

// Modal components
import { AboutComponent } from './components/modals/about/about.component';
import { AddTreeComponent } from './components/modals/add-tree/add-tree.component';
import { EmptyTreesComponent } from './components/modals/empty-trees/empty-trees.component';

// Resolvers
import { SpeciesResolver } from './resolvers/species.resolver';
import { TreesResolver } from './resolvers/trees.resolver';

// Services
import { ApiService } from './services/api.service';
import { NominatimService } from './services/nominatim.service';
import { CacheService } from './services/cache.service';

// ngx-bootstrap
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

// ngx-leaflet
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';

// ng2-adsense
import { AdsenseModule } from 'ng2-adsense';

// Font Awesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    HomeComponent,
    MapComponent,
    FormComponent,
    TreeComponent,
    LoaderComponent,
    AddTreeComponent,
    AboutComponent,
    EmptyTreesComponent,
    SpeciesSelectComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    PopoverModule.forRoot(),
    TooltipModule.forRoot(),
    AdsenseModule.forRoot(),
    HttpClientModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CacheService, multi: true },
    ApiService,
    NominatimService,
    SpeciesResolver,
    TreesResolver,
    Title,
  ],
})
export class AppModule { }
