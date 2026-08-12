import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ApiService } from '../services/api.service';

@Injectable()
export class TreeResolver implements Resolve<any> {

  constructor(private apiService: ApiService) {}

  public resolve(route: ActivatedRouteSnapshot): any {
    const id = route.paramMap.get('id');
    return this.apiService.getTree(id);
  }
}
