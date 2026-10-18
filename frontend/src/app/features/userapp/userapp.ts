import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserappService } from '../../core/userapp.service';
import { Category, Locality, Place } from '../../core/models';

interface UserPos {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-userapp',
  imports: [FormsModule],
  templateUrl: './userapp.html',
  styleUrl: './userapp.css'
})
export class Userapp implements OnInit {
  private service = inject(UserappService);

  localities = signal<Locality[]>([]);
  categories = signal<Category[]>([]);
  places = signal<Place[]>([]);
  loading = signal(false);
  error = signal('');

  // GPS
  userPos = signal<UserPos | null>(null);
  locating = signal(false);
  geoMsg = signal('');
  radius = signal(0); // 0 = sin límite

  localityId: number | null = null;
  categoryId: number | null = null;
  openNow = true;
  search = '';

  // Lista final: con ubicación activa se ordena por distancia y se aplica el radio
  visible = computed(() => {
    const pos = this.userPos();
    const list = this.places().map((place) => ({
      place,
      distance: pos ? this.distanceTo(place, pos) : null
    }));
    if (!pos) return list;
    const r = this.radius();
    return list
      .filter((x) => r === 0 || (x.distance !== null && x.distance <= r))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  });

  ngOnInit(): void {
    this.service.getLocalities().subscribe({
      next: (data) => this.localities.set(data),
      error: () => this.error.set('No se pudo conectar con la API')
    });
    this.service.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.error.set('No se pudo conectar con la API')
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service
      .getPlaces({
        localityId: this.localityId,
        categoryId: this.categoryId,
        openNow: this.openNow,
        search: this.search
      })
      .subscribe({
        next: (data) => {
          this.places.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo conectar con la API');
          this.loading.set(false);
        }
      });
  }

  pickCategory(id: number | null): void {
    this.categoryId = id;
    this.load();
  }

  /* ---------- GPS ---------- */
  nearMe(): void {
    this.geoMsg.set('');
    if (!navigator.geolocation) {
      this.geoMsg.set('Tu navegador no soporta geolocalización.');
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userPos.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.locating.set(false);
      },
      (err) => {
        this.locating.set(false);
        this.geoMsg.set(
          err.code === err.PERMISSION_DENIED
            ? 'No diste permiso de ubicación. Habilitalo desde el candado de la barra de direcciones.'
            : 'No se pudo obtener tu ubicación. Probá de nuevo.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  clearLocation(): void {
    this.userPos.set(null);
    this.geoMsg.set('');
  }

  // Distancia en km entre el usuario y el lugar (fórmula de Haversine)
  private distanceTo(p: Place, pos: UserPos): number | null {
    if (p.latitude === null || p.longitude === null) return null;
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(lat - pos.lat);
    const dLng = rad(lng - pos.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(pos.lat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(a));
  }

  km(d: number): string {
    if (d < 1) return `${Math.round(d * 1000)} m`;
    return `${d.toFixed(1).replace('.', ',')} km`;
  }

  hoy(p: Place): string {
    const day = new Date().getDay();
    const rangos = p.schedules
      .filter((s) => s.day_of_week === day)
      .sort((a, b) => a.open_time.localeCompare(b.open_time))
      .map((s) => `${s.open_time.slice(0, 5)} a ${s.close_time.slice(0, 5)}`);
    return rangos.length ? rangos.join(' y ') : 'sin atención';
  }

  mapUrl(p: Place): string | null {
    if (p.latitude === null || p.longitude === null) return null;
    return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  }
}