import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataExtractionDropdownComponent } from './data-extraction-dropdown.component';

describe('DataExtractionDropdownComponent', () => {
  let component: DataExtractionDropdownComponent;
  let fixture: ComponentFixture<DataExtractionDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataExtractionDropdownComponent]
    });
    fixture = TestBed.createComponent(DataExtractionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
