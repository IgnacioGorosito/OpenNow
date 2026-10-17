import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Userapp } from './userapp';

describe('Userapp', () => {
  let fixture: ComponentFixture<Userapp>;
  let component: Userapp;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Userapp],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Userapp);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pide localidades, categorías y lugares al iniciar', () => {
    http.expectOne('http://localhost:3000/api/userapp/localities').flush([]);
    http.expectOne('http://localhost:3000/api/userapp/categories').flush([]);
    http.expectOne((req) => req.url === 'http://localhost:3000/api/userapp/places').flush([]);
    expect(component.places().length).toBe(0);
  });
});