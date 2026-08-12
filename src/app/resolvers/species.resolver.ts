import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ApiService } from '../services/api.service';

@Injectable()
export class SpeciesResolver implements Resolve<any> {

  constructor(private apiService: ApiService) {}

  public resolve(route: ActivatedRouteSnapshot): any {
    return this.apiService.getSpecies();
  }
}
