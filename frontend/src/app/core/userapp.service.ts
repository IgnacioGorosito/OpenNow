import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Category, Locality, Place } from './models';

export interface PlaceFilters {
  localityId?: number | null;
  categoryId?: number | null;
  openNow?: boolean;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UserappService {
  private http = inject(HttpClient);
  private base = `${API_URL}/userapp`;

  getLocalities(): Observable<Locality[]> {
    return this.http.get<Locality[]>(`${this.base}/localities`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  getPlaces(filters: PlaceFilters = {}): Observable<Place[]> {
    let params = new HttpParams();
    if (filters.localityId) params = params.set('locality_id', filters.localityId);
    if (filters.categoryId) params = params.set('category_id', filters.categoryId);
    if (filters.openNow) params = params.set('open_now', 'true');
    if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<Place[]>(`${this.base}/places`, { params });
  }
}