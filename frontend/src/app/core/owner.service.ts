import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface OwnerPlace {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_enabled: boolean;
  latitude: string | null;
  longitude: string | null;
  category_id: number;
  category_name: string;
  locality_id: number;
  locality_name: string;
  province: string | null;
}

export interface OwnerSchedule {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface PlaceBody {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  category_id: number;
  locality_id: number;
  owner_name?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private http = inject(HttpClient);
  private base = `${API_URL}/owner`;

  getPlaces(ownerName: string): Observable<OwnerPlace[]> {
    const params = new HttpParams().set('owner_name', ownerName);
    return this.http.get<OwnerPlace[]>(`${this.base}/places`, { params });
  }

  createPlace(body: PlaceBody): Observable<unknown> {
    return this.http.post(`${this.base}/places`, body);
  }

  updatePlace(id: number, body: Partial<PlaceBody>): Observable<unknown> {
    return this.http.put(`${this.base}/places/${id}`, body);
  }

  getSchedules(placeId: number): Observable<OwnerSchedule[]> {
    return this.http.get<OwnerSchedule[]>(`${this.base}/places/${placeId}/schedules`);
  }

  addSchedule(placeId: number, body: Omit<OwnerSchedule, 'id'>): Observable<unknown> {
    return this.http.post(`${this.base}/places/${placeId}/schedules`, body);
  }

  deleteSchedule(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/schedules/${id}`);
  }
}