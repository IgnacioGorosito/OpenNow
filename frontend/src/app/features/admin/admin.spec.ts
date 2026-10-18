import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Admin } from './admin';

describe('Admin', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Admin);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('carga lugares, categorías y localidades al iniciar', () => {
    const fixture = TestBed.createComponent(Admin);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/api/admin/places').flush([]);
    http.expectOne('http://localhost:3000/api/admin/categories').flush([{ id: 1, name: 'Farmacia', icon: null }]);
    http.expectOne('http://localhost:3000/api/admin/localities').flush([]);
    expect(fixture.componentInstance.categories().length).toBe(1);
  });
});