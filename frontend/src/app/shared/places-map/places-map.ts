import {
  Component, ElementRef, OnDestroy, ViewEncapsulation,
  afterNextRender, computed, effect, input, viewChild
} from '@angular/core';
import * as L from 'leaflet';
import { Place } from '../../core/models';
import { Coords, coordsOf, formatKm } from '../../core/geo';

export interface MapItem {
  place: Place;
  distance: number | null;
}

// Los datos los cargan los dueños: se escapan antes de armar el HTML del popup
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Component({
  selector: 'app-places-map',
  templateUrl: './places-map.html',
  styleUrl: './places-map.css',
  encapsulation: ViewEncapsulation.None // Leaflet crea elementos fuera de la vista de Angular
})
export class PlacesMap implements OnDestroy {
  items = input.required<MapItem[]>();
  userPos = input<Coords | null>(null);

  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private map: L.Map | null = null;
  private layer: L.LayerGroup | null = null;

  withoutLocation = computed(() => this.items().filter((i) => coordsOf(i.place) === null).length);

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.mapEl().nativeElement).setView([-33.7456, -61.9688], 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.map.invalidateSize();
      this.render(this.items(), this.userPos());
    });

    // Cada vez que cambian los lugares o la posición, se redibuja
    effect(() => {
      const items = this.items();
      const pos = this.userPos();
      this.render(items, pos);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private render(items: MapItem[], pos: Coords | null): void {
    if (!this.map || !this.layer) return;
    this.layer.clearLayers();
    const points: L.LatLngTuple[] = [];

    for (const item of items) {
      const c = coordsOf(item.place);
      if (!c) continue;
      points.push([c.lat, c.lng]);
      L.marker([c.lat, c.lng], { icon: this.pin(item.place.is_open), title: item.place.name })
        .bindPopup(this.popup(item, c))
        .addTo(this.layer);
    }

    if (pos) {
      points.push([pos.lat, pos.lng]);
      L.circleMarker([pos.lat, pos.lng], {
        radius: 9, color: '#ffffff', weight: 3, fillColor: '#0B7F72', fillOpacity: 1
      })
        .bindTooltip('Estás acá')
        .addTo(this.layer);
    }

    if (points.length === 1) {
      this.map.setView(points[0], 15);
    } else if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    }
  }

  private pin(open: boolean): L.DivIcon {
    return L.divIcon({
      className: `pin ${open ? 'open' : 'closed'}`,
      html: '<span></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 34],
      popupAnchor: [0, -30]
    });
  }

  private popup(item: MapItem, c: Coords): string {
    const p = item.place;
    const estado = p.is_open
      ? '<span class="pm-badge open">Abierto</span>'
      : '<span class="pm-badge closed">Cerrado</span>';
    const direccion = p.address ? `<div class="pm-muted">${esc(p.address)}</div>` : '';
    const distancia =
      item.distance !== null ? `<div class="pm-dist">A ${formatKm(item.distance)} de vos</div>` : '';
    return `
      <div class="pm">
        <strong>${esc(p.name)}</strong>
        <div class="pm-muted">${esc(p.category.name)} · ${esc(p.locality.name)}</div>
        ${direccion}
        <div>${estado}</div>
        ${distancia}
        <a class="pm-link" href="https://www.google.com/maps/search/?api=1&amp;query=${c.lat},${c.lng}"
           target="_blank" rel="noopener">Cómo llegar</a>
      </div>`;
  }
}