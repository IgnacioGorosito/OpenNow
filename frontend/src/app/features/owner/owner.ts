import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OwnerService, OwnerPlace, OwnerSchedule } from '../../core/owner.service';
import { UserappService } from '../../core/userapp.service';
import { AuthService } from '../../core/auth.service';
import { Locality, Category } from '../../core/models';

@Component({
  selector: 'app-owner',
  imports: [FormsModule],
  templateUrl: './owner.html',
  styleUrl: './owner.css'
})
export class Owner implements OnInit {
  private ownerService = inject(OwnerService);
  private userappService = inject(UserappService);
  private auth = inject(AuthService);

  // El dueño se identifica con el nombre de su cuenta
  ownerName = computed(() => this.auth.user()?.name ?? '');

  localities = signal<Locality[]>([]);
  categories = signal<Category[]>([]);
  places = signal<OwnerPlace[]>([]);
  schedules = signal<OwnerSchedule[]>([]);
  selectedPlace = signal<OwnerPlace | null>(null);
  message = signal('');
  error = signal('');

  editingId: number | null = null;
  form = this.emptyForm();

  days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  newSchedule = { day_of_week: 1, open_time: '08:00', close_time: '13:00' };

  ngOnInit(): void {
    this.userappService.getLocalities().subscribe({
      next: (data) => this.localities.set(data),
      error: () => this.error.set('No se pudo conectar con la API')
    });
    this.userappService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.error.set('No se pudo conectar con la API')
    });
    if (this.ownerName()) this.loadPlaces();
  }

  private emptyForm() {
    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      category_id: null as number | null,
      locality_id: null as number | null,
      latitude: null as number | null,
      longitude: null as number | null
    };
  }

  loadPlaces(): void {
    this.ownerService.getPlaces(this.ownerName()).subscribe({
      next: (data) => {
        this.places.set(data);
        this.error.set('');
      },
      error: () => this.error.set('No se pudieron cargar tus lugares')
    });
  }

  usarMiUbicacion(): void {
    this.message.set('');
    this.error.set('');
    if (!navigator.geolocation) {
      this.error.set('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.form.latitude = Number(pos.coords.latitude.toFixed(6));
        this.form.longitude = Number(pos.coords.longitude.toFixed(6));
        this.message.set('Ubicación cargada. Guardá el lugar para confirmarla.');
      },
      () => this.error.set('No se pudo obtener la ubicación. Permití el acceso desde el candado de la barra de direcciones.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  guardar(): void {
    this.message.set('');
    this.error.set('');
    const f = this.form;
    if (!f.name.trim() || !f.category_id || !f.locality_id) {
      this.error.set('Nombre, categoría y localidad son obligatorios');
      return;
    }
    const body = {
      name: f.name.trim(),
      address: f.address,
      phone: f.phone,
      email: f.email,
      description: f.description,
      category_id: f.category_id,
      locality_id: f.locality_id,
      latitude: f.latitude ?? undefined,
      longitude: f.longitude ?? undefined
    };
    const request = this.editingId
      ? this.ownerService.updatePlace(this.editingId, body)
      : this.ownerService.createPlace({ ...body, owner_name: this.ownerName() });

    request.subscribe({
      next: () => {
        this.message.set(this.editingId ? 'Lugar actualizado' : 'Lugar creado');
        this.cancelar();
        this.loadPlaces();
      },
      error: () => this.error.set('No se pudo guardar el lugar')
    });
  }

  editar(p: OwnerPlace): void {
    this.editingId = p.id;
    this.form = {
      name: p.name,
      address: p.address ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      description: p.description ?? '',
      category_id: p.category_id,
      locality_id: p.locality_id,
      latitude: p.latitude !== null ? Number(p.latitude) : null,
      longitude: p.longitude !== null ? Number(p.longitude) : null
    };
    this.message.set('');
    this.error.set('');
  }

  cancelar(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  verHorarios(p: OwnerPlace): void {
    this.selectedPlace.set(p);
    this.loadSchedules();
  }

  loadSchedules(): void {
    const place = this.selectedPlace();
    if (!place) return;
    this.ownerService.getSchedules(place.id).subscribe({
      next: (data) => this.schedules.set(data),
      error: () => this.error.set('No se pudieron cargar los horarios')
    });
  }

  agregarHorario(): void {
    const place = this.selectedPlace();
    if (!place) return;
    this.error.set('');
    const s = this.newSchedule;
    if (!s.open_time || !s.close_time || s.close_time <= s.open_time) {
      this.error.set('La hora de cierre debe ser posterior a la de apertura');
      return;
    }
    this.ownerService.addSchedule(place.id, { ...s }).subscribe({
      next: () => this.loadSchedules(),
      error: () => this.error.set('No se pudo guardar el horario')
    });
  }

  borrarHorario(s: OwnerSchedule): void {
    this.ownerService.deleteSchedule(s.id).subscribe({
      next: () => this.loadSchedules(),
      error: () => this.error.set('No se pudo borrar el horario')
    });
  }

  hora(t: string): string {
    return t.slice(0, 5);
  }
}