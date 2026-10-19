import { TestBed } from '@angular/core/testing';
import { PlacesMap } from './places-map';

describe('PlacesMap', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(PlacesMap);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});