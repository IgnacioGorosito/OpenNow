import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Owner } from './owner';

describe('Owner', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Owner],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Owner);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('carga categorías y localidades al iniciar', () => {
    const fixture = TestBed.createComponent(Owner);
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/api/userapp/localities').flush([{ id: 1, name: 'Venado Tuerto' }]);
    http.expectOne('http://localhost:3000/api/userapp/categories').flush([{ id: 1, name: 'Farmacia' }]);
    expect(fixture.componentInstance.localities().length).toBe(1);
    expect(fixture.componentInstance.categories().length).toBe(1);
  });
});