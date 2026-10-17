import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Locality, Place } from '../../core/models';
import { UserappService } from '../../core/userapp.service';

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

  localityId: number | null = null;
  categoryId: number | null = null;
  openNow = true;
  search = '';

  ngOnInit() {
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

  load() {
    this.loading.set(true);
    this.service
      .getPlaces({
        locality_id: this.localityId,
        category_id: this.categoryId,
        open_now: this.openNow,
        search: this.search
      })
      .subscribe({
        next: (data) => {
          this.places.set(data);
          this.error.set('');
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo conectar con la API');
          this.loading.set(false);
        }
      });
  }
}