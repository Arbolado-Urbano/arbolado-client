import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private loading = new Subject<boolean>();
  public modifyLoading$: Observable<boolean> = this.loading.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Updates the "loading" variable.
   * @param state - The new "loading" state.
   */
  public setLoading(state: boolean): void {
    this.loading.next(state);
  }

  /**
   * Gets the list of species from the API
   * @return Observable.
   */
  public getSpecies(): Observable<any> {
    this.setLoading(true); // Update loading status

    const params = {
      params: {},
    };

    return this.http.get<any>(`${API_URL}/especies`, params).pipe(
      catchError((err) => throwError(err)),
      finalize(() => this.setLoading(false)),
    );
  }

}
