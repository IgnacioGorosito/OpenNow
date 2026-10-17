import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api.config';
import { Category, Locality, Place } from './models';

export interface PlaceFilters {
  locality_id?: number | null;
  category_id?: number | null;
  open_now?: boolean;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UserappService {
  private http = inject(HttpClient);
  private url = `${API_URL}/userapp`;

  getLocalities() {
    return this.http.get<Locality[]>(`${this.url}/localities`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.url}/categories`);
  }

  getPlaces(filters: PlaceFilters) {
    let params = new HttpParams();
    if (filters.locality_id) params = params.set('locality_id', filters.locality_id);
    if (filters.category_id) params = params.set('category_id', filters.category_id);
    if (filters.open_now) params = params.set('open_now', 'true');
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<Place[]>(`${this.url}/places`, { params });
  }
}
