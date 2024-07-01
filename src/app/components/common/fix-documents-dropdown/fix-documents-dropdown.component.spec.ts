import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixDocumentsDropdownComponent } from './fix-documents-dropdown.component';

describe('FixDocumentsDropdownComponent', () => {
  let component: FixDocumentsDropdownComponent;
  let fixture: ComponentFixture<FixDocumentsDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FixDocumentsDropdownComponent]
    });
    fixture = TestBed.createComponent(FixDocumentsDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
