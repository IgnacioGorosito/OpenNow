import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService, AdminPlace, AdminCategory, AdminLocality } from '../../core/admin.service';

type Tab = 'places' | 'categories' | 'localities';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  private admin = inject(AdminService);

  tab = signal<Tab>('places');
  places = signal<AdminPlace[]>([]);
  categories = signal<AdminCategory[]>([]);
  localities = signal<AdminLocality[]>([]);
  message = signal('');
  error = signal('');

  catForm = { name: '', icon: '' };
  catEditing: number | null = null;
  locForm = { name: '', province: '' };
  locEditing: number | null = null;

  ngOnInit(): void {
    this.loadPlaces();
    this.loadCategories();
    this.loadLocalities();
  }

  setTab(t: Tab): void {
    this.tab.set(t);
    this.message.set('');
    this.error.set('');
  }

  private fail(err: HttpErrorResponse, fallback: string): void {
    this.message.set('');
    this.error.set(err?.error?.error ?? fallback);
  }

  private ok(text: string): void {
    this.error.set('');
    this.message.set(text);
  }

  /* ---------- Lugares ---------- */
  loadPlaces(): void {
    this.admin.getPlaces().subscribe({
      next: (d) => this.places.set(d),
      error: (e) => this.fail(e, 'No se pudo conectar con la API')
    });
  }

  togglePlace(p: AdminPlace): void {
    this.admin.togglePlace(p.id).subscribe({
      next: () => {
        this.ok(p.is_enabled ? 'Lugar deshabilitado' : 'Lugar habilitado');
        this.loadPlaces();
      },
      error: (e) => this.fail(e, 'No se pudo cambiar el estado')
    });
  }

  deletePlace(p: AdminPlace): void {
    if (!confirm(`¿Eliminar "${p.name}"? No se puede deshacer.`)) return;
    this.admin.deletePlace(p.id).subscribe({
      next: () => {
        this.ok('Lugar eliminado');
        this.loadPlaces();
      },
      error: (e) => this.fail(e, 'No se pudo eliminar el lugar')
    });
  }

  /* ---------- Categorías ---------- */
  loadCategories(): void {
    this.admin.getCategories().subscribe({
      next: (d) => this.categories.set(d),
      error: (e) => this.fail(e, 'No se pudo conectar con la API')
    });
  }

  saveCategory(): void {
    const name = this.catForm.name.trim();
    if (!name) {
      this.fail({ error: { error: 'El nombre es obligatorio' } } as HttpErrorResponse, '');
      return;
    }
    const body = { name, icon: this.catForm.icon.trim() || undefined };
    const req = this.catEditing
      ? this.admin.updateCategory(this.catEditing, body)
      : this.admin.createCategory(body);
    req.subscribe({
      next: () => {
        this.ok(this.catEditing ? 'Categoría actualizada' : 'Categoría creada');
        this.cancelCategory();
        this.loadCategories();
      },
      error: (e) => this.fail(e, 'No se pudo guardar la categoría')
    });
  }

  editCategory(c: AdminCategory): void {
    this.catEditing = c.id;
    this.catForm = { name: c.name, icon: c.icon ?? '' };
  }

  cancelCategory(): void {
    this.catEditing = null;
    this.catForm = { name: '', icon: '' };
  }

  deleteCategory(c: AdminCategory): void {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    this.admin.deleteCategory(c.id).subscribe({
      next: () => {
        this.ok('Categoría eliminada');
        this.loadCategories();
      },
      error: (e) => this.fail(e, 'No se pudo eliminar la categoría')
    });
  }

  /* ---------- Localidades ---------- */
  loadLocalities(): void {
    this.admin.getLocalities().subscribe({
      next: (d) => this.localities.set(d),
      error: (e) => this.fail(e, 'No se pudo conectar con la API')
    });
  }

  saveLocality(): void {
    const name = this.locForm.name.trim();
    if (!name) {
      this.fail({ error: { error: 'El nombre es obligatorio' } } as HttpErrorResponse, '');
      return;
    }
    const body = { name, province: this.locForm.province.trim() || undefined };
    const req = this.locEditing
      ? this.admin.updateLocality(this.locEditing, body)
      : this.admin.createLocality(body);
    req.subscribe({
      next: () => {
        this.ok(this.locEditing ? 'Localidad actualizada' : 'Localidad creada');
        this.cancelLocality();
        this.loadLocalities();
      },
      error: (e) => this.fail(e, 'No se pudo guardar la localidad')
    });
  }

  editLocality(l: AdminLocality): void {
    this.locEditing = l.id;
    this.locForm = { name: l.name, province: l.province ?? '' };
  }

  cancelLocality(): void {
    this.locEditing = null;
    this.locForm = { name: '', province: '' };
  }

  deleteLocality(l: AdminLocality): void {
    if (!confirm(`¿Eliminar la localidad "${l.name}"?`)) return;
    this.admin.deleteLocality(l.id).subscribe({
      next: () => {
        this.ok('Localidad eliminada');
        this.loadLocalities();
      },
      error: (e) => this.fail(e, 'No se pudo eliminar la localidad')
    });
  }
}