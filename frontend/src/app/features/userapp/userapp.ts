import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserappService } from '../../core/userapp.service';
import { Category, Locality, Place } from '../../core/models';
import { Coords, coordsOf, distanceKm, formatKm } from '../../core/geo';
import { PlacesMap } from '../../shared/places-map/places-map';

@Component({
  selector: 'app-userapp',
  imports: [FormsModule, PlacesMap],
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

  // Vista: lista de tarjetas o mapa
  view = signal<'list' | 'map'>('list');

  // GPS
  userPos = signal<Coords | null>(null);
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
    const list = this.places().map((place) => {
      const c = coordsOf(place);
      return { place, distance: pos && c ? distanceKm(pos, c) : null };
    });
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

  km(d: number): string {
    return formatKm(d);
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
    const c = coordsOf(p);
    if (!c) return null;
    return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
  }
}