import { Component } from '@angular/core'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject } from 'rxjs'
import { first, takeUntil } from 'rxjs/operators'
import { EditDialogComponent } from 'src/app/components/common/edit-dialog/edit-dialog.component'
import { DEFAULT_MATCHING_ALGORITHM, MATCH_AUTO } from 'src/app/data/matching-model'
import { PaperlessCustomField } from 'src/app/data/paperless-custom-field'
import { PaperlessDocumentType } from 'src/app/data/paperless-document-type'
import { CustomFieldsService } from 'src/app/services/rest/custom-fields.service'
import { DocumentTypeService } from 'src/app/services/rest/document-type.service'
import { UserService } from 'src/app/services/rest/user.service'
import { SettingsService } from 'src/app/services/settings.service'

@Component({
  selector: 'pngx-document-type-edit-dialog',
  templateUrl: './document-type-edit-dialog.component.html',
  styleUrls: ['./document-type-edit-dialog.component.scss'],
})
export class DocumentTypeEditDialogComponent extends EditDialogComponent<PaperlessDocumentType> {
  customFields: PaperlessCustomField[]
  unsubscribeNotifier: Subject<any> = new Subject()
  selectedFields: PaperlessCustomField[] = [];
  getActionupdate() {
    return 'update_type';
  }
  getAction() {
    return "post_type"
  }
  constructor(
    service: DocumentTypeService,
    activeModal: NgbActiveModal,
    userService: UserService,
    settingsService: SettingsService,
    private customFieldsService: CustomFieldsService,
    
  ) {
    super(service, activeModal, userService, settingsService)
  }
  ngOnInit() {
    //super.ngOnInit();
    this.getCustomFields();
  }
  getCreateTitle() {
    return $localize`Create new document type`
  }
  onSelectedFieldsChange(selectedFields: PaperlessCustomField[]) {
    this.selectedFields = selectedFields;
    const selectedFieldIds = selectedFields.map(field => field.id);
    this.objectForm.get('ExtractedData').patchValue(selectedFieldIds);
    console.log(this.selectedFields);
  }
  getEditTitle() {
    return $localize`Edit document type`
  }

  getForm(): FormGroup {
    return new FormGroup({
      name: new FormControl(''),
      matching_algorithm: new FormControl(DEFAULT_MATCHING_ALGORITHM),
      match: new FormControl(['']),
      is_insensitive: new FormControl(true),
      ExtractedData : new FormControl([]),
      permissions_form: new FormControl(null),
    })
  }
  isAutoMatchingSelected(): boolean {
    return this.getForm().get('matching_algorithm').value === MATCH_AUTO;
  }
  private getCustomFields() {

    this.customFieldsService
      .listAllCustom()
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.customFields = result.results))
  }
  onFormSubmit(event: Event) {
   console.log(this.customFieldFormFields);
    
    console.log(this.objectForm.value)
    event.preventDefault(); // Prevent default form submission behavior
    this.save(); // Manually call the save method or perform any other necessary action
  }
  public refreshCustomFields() {
    this.customFieldsService.clearCache()
    this.getCustomFields()
  }
  get customFieldFormFields(): FormArray {
    return this.objectForm.get('customFields') as FormArray
  }
}
