import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, first, takeUntil } from 'rxjs';
import { PaperlessCustomField } from 'src/app/data/paperless-custom-field';
import { PaperlessCustomFieldInstance } from 'src/app/data/paperless-custom-field-instance';
import { PermissionsService } from 'src/app/services/permissions.service';
import { CustomFieldsService } from 'src/app/services/rest/custom-fields.service';
import { ToastService } from 'src/app/services/toast.service';
import { CustomFieldEditDialogComponent } from '../edit-dialog/custom-field-edit-dialog/custom-field-edit-dialog.component';

@Component({
  selector: 'pngx-data-extraction-dropdown',
  templateUrl: './data-extraction-dropdown.component.html',
  styleUrls: ['./data-extraction-dropdown.component.scss']
})
export class DataExtractionDropdownComponent implements OnDestroy{
  @Input()
  documentId: number

  @Input()
  disabled: boolean = false

  @Input()
  existingFields: PaperlessCustomFieldInstance[] = []
  public selectedField: PaperlessCustomField;
  @Output()
  added: EventEmitter<PaperlessCustomField> = new EventEmitter()
  @Output()
  selectedFieldsChange: EventEmitter<PaperlessCustomField[]> = new EventEmitter()
  @Output()
  created: EventEmitter<PaperlessCustomField> = new EventEmitter()

  private customFields: PaperlessCustomField[] = []
  public unusedFields: PaperlessCustomField[]
  public selectedFields: PaperlessCustomField[] = [];
  public name: string

  public field: string
 
  private unsubscribeNotifier: Subject<any> = new Subject()
  get placeholderText(): string {
    return $localize`Choose field`
  }

  get notFoundText(): string {
    return $localize`No unused fields found`
  }

  /* get canCreateFields(): boolean {
    return this.permissionsService.currentUserCan(
      PermissionAction.Add,
      PermissionType.CustomField
    )
  } */

  constructor(
    private customFieldsService: CustomFieldsService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private permissionsService: PermissionsService
  ) {
    this.getFields()
  }

  ngOnDestroy(): void {
    this.unsubscribeNotifier.next(this)
    this.unsubscribeNotifier.complete()
  }

  private getFields() {
    this.customFieldsService
      .listAllCustom("list_customfield")
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => {
        console.log(result.results)
        if (Array.isArray(result.results)) {
          this.customFields = result.results;
          console.log(this.customFields)
          this.updateUnusedFields();
        } else {
          console.error("result.results is not an array");
          // Handle the case when result.results is not an array
        }
      })
  }
  
  public getCustomFieldFromInstance(
    instance: PaperlessCustomFieldInstance
  ): PaperlessCustomField {
    return this.customFields.find((f) => f.id === instance.field)
  }

  private updateUnusedFields() {
    console.log(this.customFields)
    this.unusedFields = this.customFields.filter(
      (f) =>
        !this.existingFields?.find(
          (e) => this.getCustomFieldFromInstance(e)?.id === f.id
        )
    )
  }

  onOpenClose() {
    this.field = undefined
    this.updateUnusedFields()
  }

  addField() {
     //this.added.emit(this.customFields.find((f) => f.id === this.field))
   
    const selectedField = this.customFields.find((f) => f.id === this.field);

    if (selectedField) {
        this.selectedFields.push(selectedField);
        this.selectedFieldsChange.emit(this.selectedFields); 
    }

  }
  removeField(index: number) {
    // Remove the selected field at the given index
    this.selectedFields.splice(index, 1);
}
  createField(newName: string = null) {
    const modal = this.modalService.open(CustomFieldEditDialogComponent)
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.succeeded
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe((newField) => {
        this.toastService.showInfo($localize`Saved field "${newField.name}".`)
        this.customFieldsService.clearCache()
        this.getFields()
        this.created.emit(newField)
      })
    modal.componentInstance.failed
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe((e) => {
        this.toastService.showError($localize`Error saving field.`, e)
      })
  }
}
