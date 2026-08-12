import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ApiService } from '../services/api.service';

@Injectable()
export class TreesResolver implements Resolve<any> {

  constructor(private apiService: ApiService) {}

  public resolve(route: ActivatedRouteSnapshot): any {
    return new Promise((resolve, reject) => {
      const data = {
        user_sabores: route.queryParamMap.get('user_sabores'),
        user_latlng: route.queryParamMap.get('user_latlng'),
        user_origen: route.queryParamMap.get('user_origen'),
        borigen_cuyana: route.queryParamMap.get('borigen_cuyana'),
        borigen_nea: route.queryParamMap.get('borigen_nea'),
        borigen_noa: route.queryParamMap.get('borigen_noa'),
        borigen_pampeana: route.queryParamMap.get('borigen_pampeana'),
        borigen_patagonica: route.queryParamMap.get('borigen_patagonica'),
        especie_id: route.queryParamMap.get('especie_id'),
        radio: route.queryParamMap.get('radio'),
      };
      this.apiService.search(data).subscribe((trees) => resolve(trees));
    });
  }
}
