import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface AdminPlace {
  id: number;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  owner_name: string | null;
  is_enabled: boolean;
  category_name: string;
  locality_name: string;
  province: string | null;
}

export interface AdminCategory {
  id: number;
  name: string;
  icon: string | null;
}

export interface AdminLocality {
  id: number;
  name: string;
  province: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin`;

  getPlaces(): Observable<AdminPlace[]> {
    return this.http.get<AdminPlace[]>(`${this.base}/places`);
  }
  togglePlace(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/places/${id}/toggle`, {});
  }
  deletePlace(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/places/${id}`);
  }

  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.base}/categories`);
  }
  createCategory(body: { name: string; icon?: string }): Observable<unknown> {
    return this.http.post(`${this.base}/categories`, body);
  }
  updateCategory(id: number, body: { name?: string; icon?: string }): Observable<unknown> {
    return this.http.put(`${this.base}/categories/${id}`, body);
  }
  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/categories/${id}`);
  }

  getLocalities(): Observable<AdminLocality[]> {
    return this.http.get<AdminLocality[]>(`${this.base}/localities`);
  }
  createLocality(body: { name: string; province?: string }): Observable<unknown> {
    return this.http.post(`${this.base}/localities`, body);
  }
  updateLocality(id: number, body: { name?: string; province?: string }): Observable<unknown> {
    return this.http.put(`${this.base}/localities/${id}`, body);
  }
  deleteLocality(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/localities/${id}`);
  }
}