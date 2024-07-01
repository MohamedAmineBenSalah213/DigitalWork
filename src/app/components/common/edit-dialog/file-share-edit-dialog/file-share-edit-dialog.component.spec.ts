import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileShareEditDialogComponent } from './file-share-edit-dialog.component';

describe('FileShareEditDialogComponent', () => {
  let component: FileShareEditDialogComponent;
  let fixture: ComponentFixture<FileShareEditDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileShareEditDialogComponent]
    });
    fixture = TestBed.createComponent(FileShareEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
