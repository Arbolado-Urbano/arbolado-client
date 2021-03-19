import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/views/home/home.component';

import { SpeciesResolver } from './resolvers/species.resolver';

const routes: Routes = [
  {
    component: HomeComponent,
    path: '',
    resolve: { species: SpeciesResolver },
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes, {
    // enableTracing :true, // For debugging
    scrollPositionRestoration: 'enabled',
    useHash: false,
    relativeLinkResolution: 'legacy'
})],
})
export class AppRoutingModule { }
