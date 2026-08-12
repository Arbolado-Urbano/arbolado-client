import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpInterceptor, HttpHandler } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CacheService implements HttpInterceptor {
  private cache: Map<string, Observable<HttpEvent<any>>> = new Map();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Key for the hash
    const cacheKey = req.urlWithParams;

    // If the response is not cached...
    if (!this.cache.has(cacheKey)) {
      // ...set it
      const res = next.handle(req).pipe(shareReplay(1));
      // ...and cache it
      this.cache.set(cacheKey, res);
    }

    // Return the cached response
    return this.cache.get(cacheKey);
  }
}
