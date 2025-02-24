import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import {
  NgbDateStruct,
  NgbModal,
  NgbNav,
  NgbNavChangeEvent,
} from '@ng-bootstrap/ng-bootstrap'
import { PaperlessCorrespondent } from 'src/app/data/paperless-correspondent'
import { PaperlessDocument } from 'src/app/data/paperless-document'
import { PaperlessDocumentMetadata } from 'src/app/data/paperless-document-metadata'
import { PaperlessDocumentType } from 'src/app/data/paperless-document-type'
import { PaperlessTag } from 'src/app/data/paperless-tag'
import { DocumentTitlePipe } from 'src/app/pipes/document-title.pipe'
import { DocumentListViewService } from 'src/app/services/document-list-view.service'
import { OpenDocumentsService } from 'src/app/services/open-documents.service'
import { CorrespondentService } from 'src/app/services/rest/correspondent.service'
import { DocumentTypeService } from 'src/app/services/rest/document-type.service'
import { DocumentService } from 'src/app/services/rest/document.service'
import { ConfirmDialogComponent } from '../common/confirm-dialog/confirm-dialog.component'
import { CorrespondentEditDialogComponent } from '../common/edit-dialog/correspondent-edit-dialog/correspondent-edit-dialog.component'
import { DocumentTypeEditDialogComponent } from '../common/edit-dialog/document-type-edit-dialog/document-type-edit-dialog.component'
import { PDFDocumentProxy } from 'ng2-pdf-viewer'
import { ToastService } from 'src/app/services/toast.service'
import { TextComponent } from '../common/input/text/text.component'
import { SettingsService } from 'src/app/services/settings.service'
import { dirtyCheck, DirtyComponent } from '@ngneat/dirty-check-forms'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import {
  first,
  takeUntil,
  switchMap,
  map,
  debounceTime,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators'
import { PaperlessDocumentSuggestions } from 'src/app/data/paperless-document-suggestions'
import {
  FILTER_CORRESPONDENT,
  FILTER_CREATED_AFTER,
  FILTER_CREATED_BEFORE,
  FILTER_DOCUMENT_TYPE,
  FILTER_FULLTEXT_MORELIKE,
  FILTER_HAS_TAGS_ALL,
  FILTER_STORAGE_PATH,
} from 'src/app/data/filter-rule-type'
import { StoragePathService } from 'src/app/services/rest/storage-path.service'
import { PaperlessStoragePath } from 'src/app/data/paperless-storage-path'
import { StoragePathEditDialogComponent } from '../common/edit-dialog/storage-path-edit-dialog/storage-path-edit-dialog.component'
import { SETTINGS_KEYS } from 'src/app/data/paperless-uisettings'
import {
  PermissionAction,
  PermissionsService,
  PermissionType,
} from 'src/app/services/permissions.service'
import { PaperlessUser } from 'src/app/data/paperless-user'
import { UserService } from 'src/app/services/rest/user.service'
import { PaperlessDocumentNote } from 'src/app/data/paperless-document-note'
import { HttpClient } from '@angular/common/http'
import { ComponentWithPermissions } from '../with-permissions/with-permissions.component'
import { EditDialogMode } from '../common/edit-dialog/edit-dialog.component'
import { ObjectWithId } from 'src/app/data/object-with-id'
import { FilterRule } from 'src/app/data/filter-rule'
import { ISODateAdapter } from 'src/app/utils/ngb-iso-date-adapter'
import {
  PaperlessCustomField,
  PaperlessCustomFieldDataType,
} from 'src/app/data/paperless-custom-field'
import { PaperlessCustomFieldInstance } from 'src/app/data/paperless-custom-field-instance'
import { CustomFieldsService } from 'src/app/services/rest/custom-fields.service'
import { TagService } from 'src/app/services/rest/tag.service'

enum DocumentDetailNavIDs {
  Details = 1,
  Content = 2,
  Metadata = 3,
  Preview = 4,
  Notes = 5,
  Permissions = 6,
}

@Component({
  selector: 'pngx-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
})
export class DocumentDetailComponent
  extends ComponentWithPermissions
  implements OnInit, OnDestroy, DirtyComponent
{
  @ViewChild('inputTitle')
  titleInput: TextComponent

  expandOriginalMetadata = false
  expandArchivedMetadata = false

  error: any

  networkActive = false

  documentId: string
  document: PaperlessDocument
  metadata: PaperlessDocumentMetadata
  suggestions: PaperlessDocumentSuggestions
  users: PaperlessUser[]

  title: string
  titleSubject: Subject<string> = new Subject()
  previewUrl: string
  previewText: string
  downloadUrl: string
  downloadOriginalUrl: string

  correspondents: PaperlessCorrespondent[]
  documentTypes: PaperlessDocumentType[]
  storagePaths: PaperlessStoragePath[]

  documentForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    content: new FormControl(''),
    created_date: new FormControl(),
    correspondentId: new FormControl(''),
    documentTypeId: new FormControl(),
    storagePathId: new FormControl(),
    archive_serial_number: new FormControl(),
    tags: new FormControl([]),
    permissions_form: new FormControl(null),
    custom_fields: new FormArray([]),
    extract_data: new FormArray([]),
  })

  previewCurrentPage: number = 1
  previewNumPages: number = 1

  store: BehaviorSubject<any>
  isDirty$: Observable<boolean>
  unsubscribeNotifier: Subject<any> = new Subject()
  docChangeNotifier: Subject<any> = new Subject()

  requiresPassword: boolean = false
  password: string

  ogDate: Date

  customFields: PaperlessCustomField[]
  public readonly PaperlessCustomFieldDataType = PaperlessCustomFieldDataType

  @ViewChild('nav') nav: NgbNav
  @ViewChild('pdfPreview') set pdfPreview(element) {
    // this gets called when compontent added or removed from DOM
    if (
      element &&
      element.nativeElement.offsetParent !== null &&
      this.nav?.activeId == 4
    ) {
      // its visible
      setTimeout(() => this.nav?.select(1))
    }
  }

  DocumentDetailNavIDs = DocumentDetailNavIDs
  activeNavID: number

  constructor(
    private documentsService: DocumentService,
    private route: ActivatedRoute,
    private correspondentService: CorrespondentService,
    private documentTypeService: DocumentTypeService,
    private router: Router,
    private modalService: NgbModal,
    private openDocumentService: OpenDocumentsService,
    private documentListViewService: DocumentListViewService,
    private documentTitlePipe: DocumentTitlePipe,
    private toastService: ToastService,
    private settings: SettingsService,
    private storagePathService: StoragePathService,
    private permissionsService: PermissionsService,
    private userService: UserService,
    private customFieldsService: CustomFieldsService,
    private http: HttpClient
  ) {
    super()
  }

  titleKeyUp(event) {
    this.titleSubject.next(event.target?.value)
  }

  get useNativePdfViewer(): boolean {
    return this.settings.get(SETTINGS_KEYS.USE_NATIVE_PDF_VIEWER)
  }

  getContentType() {
    return this.metadata?.has_archive_version
      ? 'application/pdf'
      : this.metadata?.original_mime_type
  }

  get renderAsPlainText(): boolean {
    return ['text/plain', 'application/csv', 'text/csv'].includes(
      this.getContentType()
    )
  }
get isRTL() {
    if (!this.metadata || !this.metadata.lang) return false
    else {
      return ['ar', 'he', 'fe'].includes(this.metadata.lang)
    }
  }

  ngOnInit(): void {
   // debugger
    this.documentForm.valueChanges
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe(() => {
        this.error = null
        const docValues = Object.assign({}, this.documentForm.value)
        docValues['owner'] =
          this.documentForm.get('permissions_form').value['owner']
        docValues['set_permissions'] =
          this.documentForm.get('permissions_form').value['set_permissions']
        delete docValues['permissions_form']
        Object.assign(this.document, docValues)
      })

      this.correspondentService
      .listAll(null,null,"list_correspondent",null)
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.correspondents = result.results))

    this.documentTypeService
      .listAll(null,null,"list_types",null)
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.documentTypes = result.results))
    this.storagePathService
      .listAll(null,null,"list_storage_paths",null)
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.storagePaths = result.results))
   
   /* this.userService
      .listAll()
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.users = result.results)) */

    this.getCustomFields()

    this.route.paramMap
      .pipe(
        takeUntil(this.unsubscribeNotifier),
        switchMap((paramMap) => {
          const documentId = paramMap.get('id')
          this.docChangeNotifier.next(documentId)
          return this.documentsService.getlist(documentId,"get_document").pipe(
            tap(result => console.log('Result of getlist:', result))
          );
        })
      )
      .pipe(
        switchMap((doc) => {
          this.documentId = doc.id
          this.previewUrl = this.documentsService.getPreviewUrl(this.documentId)
          this.http.get(this.previewUrl, { responseType: 'text' }).subscribe({
            next: (res) => {
              this.previewText = res.toString()
            },
            error: (err) => {
              this.previewText = $localize`An error occurred loading content: ${
                err.message ?? err.toString()
              }`
            },
          })
          this.downloadUrl = this.documentsService.getDownloadUrl(
            this.documentId
          )
          this.downloadOriginalUrl = this.documentsService.getDownloadUrl(
            this.documentId,
            true
          )
          this.suggestions = null
          const openDocument = this.openDocumentService.getOpenDocument(
            this.documentId
          )
          if (openDocument) {
            if (this.documentForm.dirty) {
              Object.assign(openDocument, this.documentForm.value)
               openDocument['owner'] =
                this.documentForm.get('permissions_form').value['owner']
              openDocument['permissions'] =
                this.documentForm.get('permissions_form').value[
                  'set_permissions'
                ]
              delete openDocument['permissions_form'] 
            }
            this.updateComponent(openDocument)
          } else {
            this.openDocumentService.openDocument(doc)
            this.updateComponent(doc)
          }

          this.titleSubject
            .pipe(
              debounceTime(1000),
              distinctUntilChanged(),
              takeUntil(this.docChangeNotifier),
              takeUntil(this.unsubscribeNotifier)
            )
            .subscribe({
              next: (titleValue) => {
                // In the rare case when the field changed just after debounced event was fired.
                // We dont want to overwrite whats actually in the text field, so just return
                if (titleValue !== this.titleInput.value) return

                this.title = titleValue
                this.documentForm.patchValue({ title: titleValue })

              },
              complete: () => {
                // doc changed so we manually check dirty in case title was changed
                if (
                  this.store.getValue().title !==
                  this.documentForm.get('title').value
                ) {
                  this.openDocumentService.setDirty(doc, true)
                }
              },
            })
            
          console.log(this.store);
          
          // Initialize dirtyCheck
          this.store = new BehaviorSubject({
            title: doc.title,
            content: doc.content,
            created_date: doc.createdOn,
            correspondent: doc.correspondentId,
            document_type: doc.documentTypeId,
            storage_path: doc.storagePathId,
            archive_serial_number: doc.archive_serial_number,
            tags: [...doc.tags],
            permissions_form: {
              owner: doc.owner,
              set_permissions: doc.permissions,
            },
            custom_fields: doc.custom_fields,
          })

          this.isDirty$ = dirtyCheck(
            this.documentForm,
            this.store.asObservable()
          )
          console.log(this.documentForm);
          

          return this.isDirty$.pipe(
            takeUntil(this.unsubscribeNotifier),
            map((dirty) => ({ doc, dirty }))
          )
        })
      )
      .subscribe({
        next: ({ doc, dirty }) => {
          this.openDocumentService.setDirty(doc, dirty)
        },
         error: (error) => {
          this.router.navigate(['404'], {
            replaceUrl: true,
          })
        }, 
      })

    this.route.paramMap.subscribe((paramMap) => {
      const section = paramMap.get('section')
      if (section) {
        const navIDKey: string = Object.keys(DocumentDetailNavIDs).find(
          (navID) => navID.toLowerCase() == section
        )
        if (navIDKey) {
      
          
          this.activeNavID = DocumentDetailNavIDs[navIDKey]
          console.log(this.activeNavID);
        }
      } else if (paramMap.get('id')) {
        this.router.navigate(['documents', paramMap.get('id'), 'details'], {
          replaceUrl: true,
        })
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscribeNotifier.next(this)
    this.unsubscribeNotifier.complete()
  }

  onNavChange(navChangeEvent: NgbNavChangeEvent) {
    const [foundNavIDkey] = Object.entries(DocumentDetailNavIDs).find(
      ([, navIDValue]) => navIDValue == navChangeEvent.nextId
    )
    if (foundNavIDkey)
      this.router.navigate([
        'documents',
        this.documentId,
        foundNavIDkey.toLowerCase(),
      ])
  }
   customfiledlist: PaperlessCustomField[] =[];
  onExtactedData(event)
  {
    const extractedDataList: string[] = [];
  
    if (this.documentForm.get('documentTypeId').value !== null) {
      const foundDocumentType = this.documentTypes.find(type => type.id === this.documentForm.get('documentTypeId').value);
      if(foundDocumentType.extractedData != null)
        {
          foundDocumentType.extractedData.forEach(data => {
            extractedDataList.push(data);
          });
          extractedDataList.forEach(extractedData => {
            const foundCustomField = this.customFields?.find((customField) => customField.id == extractedData);
             if (foundCustomField) {
              this.customfiledlist.push(foundCustomField);
              this.document.custom_fields.push({
                field: foundCustomField.id,
                value: null,
                document: this.documentId,
                created: new Date(),
              })
              console.log(this.document.custom_fields);
              console.log('Custom Field Found:', foundCustomField);
            } else {
              console.log('Custom Field Not Found for Extracted Data:', extractedData);
            }}) 
        }
      
    }
    else {
      // documentTypeId is null
      console.log('documentTypeId is null');
    }
  }
  public getCustomFieldForExtractionDataFromInstance(
    instance: string
  ): PaperlessCustomField {
    return this.customfiledlist?.find((f) => f.id === instance)
  }
  updateComponent(doc: PaperlessDocument) {
    this.document = doc
    this.requiresPassword = false
     this.updateFormForCustomFields()
     debugger
     this.documentsService
      .getMetadata(doc.id)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.metadata = result

          console.log(this.metadata)
        },
        error: (error) => {
          this.metadata = null
          this.toastService.showError(
            $localize`Error retrieving metadata`,
            error
          )
        },
      }) 
    /*  if (
      this.permissionsService.currentUserHasObjectPermissions(
        PermissionAction.Change,
        doc
      )
    ) {
     this.documentsService
        .getSuggestions(doc.id)
        .pipe(first(), takeUntil(this.unsubscribeNotifier))
        .subscribe({
          next: (result) => {
            this.suggestions = result
          },
          error: (error) => {
            this.suggestions = null
            this.toastService.showError(
              $localize`Error retrieving suggestions.`,
              error
            )
          },
        }) 
    } */
    this.title = this.documentTitlePipe.transform(doc.title)
    const docFormValues = Object.assign({}, doc)
    docFormValues['permissions_form'] = {
      owner: doc.owner,
      set_permissions: doc.permissions,
    }

    this.documentForm.patchValue(docFormValues, { emitEvent: false })
    console.log(this.documentForm)
    if (!this.userCanEdit) this.documentForm.disable()
  }
  get CutomFieldsFormFieldsForExtractData (): FormArray
  {
    return this.documentForm.get('extract_data') as FormArray
  }
  get customFieldFormFields(): FormArray {
    return this.documentForm.get('custom_fields') as FormArray
  }

  createDocumentType(newName: string) {
    var modal = this.modalService.open(DocumentTypeEditDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.dialogMode = EditDialogMode.CREATE
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.succeeded
      .pipe(
        switchMap((newDocumentType) => {
          return this.documentTypeService
            .listAll()
            .pipe(map((documentTypes) => ({ newDocumentType, documentTypes })))
        })
      )
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe(({ newDocumentType, documentTypes }) => {
        this.documentTypes = documentTypes.results
        this.documentForm.get('document_type').setValue(newDocumentType.id)
      })
  }

  createCorrespondent(newName: string) {
    var modal = this.modalService.open(CorrespondentEditDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.dialogMode = EditDialogMode.CREATE
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.succeeded
      .pipe(
        switchMap((newCorrespondent) => {
          return this.correspondentService
            .listAll()
            .pipe(
              map((correspondents) => ({ newCorrespondent, correspondents }))
            )
        })
      )
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe(({ newCorrespondent, correspondents }) => {
        this.correspondents = correspondents.results
        this.documentForm.get('correspondent').setValue(newCorrespondent.id)
      })
  }

  createStoragePath(newName: string) {
    var modal = this.modalService.open(StoragePathEditDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.dialogMode = EditDialogMode.CREATE
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.succeeded
      .pipe(
        switchMap((newStoragePath) => {
          return this.storagePathService
            .listAll()
            .pipe(map((storagePaths) => ({ newStoragePath, storagePaths })))
        })
      )
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe(({ newStoragePath, storagePaths }) => {
        this.storagePaths = storagePaths.results
        this.documentForm.get('storage_path').setValue(newStoragePath.id)
      })
  }

  discard() {
    this.documentsService
      .get(this.documentId)
      .pipe(first())
      .subscribe({
        next: (doc) => {
          Object.assign(this.document, doc)
          doc['permissions_form'] = {
            owner: doc.owner,
            set_permissions: doc.permissions,
          }
          this.title = doc.title
          this.updateFormForCustomFields()
          this.documentForm.patchValue(doc)
          this.openDocumentService.setDirty(doc, false)
        },
        error: () => {
          this.router.navigate(['404'], {
            replaceUrl: true,
          })
        },
      })
  }

  save(close: boolean = false) {
    this.networkActive = true
    console.log(this.document);
    debugger
    this.documentsService
      .update(this.document,"save")
      .pipe(first())
      .subscribe({
        next: () => {
          this.store.next(this.documentForm.value)
          this.toastService.showInfo($localize`Document saved successfully.`)
          close && this.close()
          this.networkActive = false
          this.error = null
          this.openDocumentService.refreshDocument(this.documentId)
        },
        error: (error) => {
          this.networkActive = false
          if (!this.userCanEdit) {
            this.toastService.showInfo($localize`Document saved successfully.`)
            close && this.close()
          } else {
            this.error = error.error
            this.toastService.showError($localize`Error saving document`, error)
          }
        },
      })
  }

  saveEditNext() {
    this.networkActive = true
    this.store.next(this.documentForm.value)
    this.documentsService
      .update(this.document,"save")
      .pipe(
        switchMap((updateResult) => {
          return this.documentListViewService
            .getNext(this.documentId)
            .pipe(map((nextDocId) => ({ nextDocId, updateResult })))
        })
      )
      .pipe(
        switchMap(({ nextDocId, updateResult }) => {
          if (nextDocId && updateResult)
            return this.openDocumentService
              .closeDocument(this.document)
              .pipe(
                map((closeResult) => ({ updateResult, nextDocId, closeResult }))
              )
        })
      )
      .pipe(first())
      .subscribe({
        next: ({ updateResult, nextDocId, closeResult }) => {
          this.error = null
          this.networkActive = false
          if (closeResult && updateResult && nextDocId) {
            this.router.navigate(['documents', nextDocId])
            this.titleInput?.focus()
          }
        },
        error: (error) => {
          this.networkActive = false
          this.error = error.error
          this.toastService.showError($localize`Error saving document`, error)
        },
      })
  }

  close() {
    this.openDocumentService
      .closeDocument(this.document)
      .pipe(first())
      .subscribe((closed) => {
        if (!closed) return
        if (this.documentListViewService.activeSavedViewId) {
          this.router.navigate([
            'view',
            this.documentListViewService.activeSavedViewId,
          ])
        } else {
          this.router.navigate(['documents'])
        }
      })
  }

  delete() {
    let modal = this.modalService.open(ConfirmDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.title = $localize`Confirm delete`
    modal.componentInstance.messageBold = $localize`Do you really want to delete document "${this.document.title}"?`
    modal.componentInstance.message = $localize`The files for this document will be deleted permanently. This operation cannot be undone.`
    modal.componentInstance.btnClass = 'btn-danger'
    modal.componentInstance.btnCaption = $localize`Delete document`
    this.subscribeModalDelete(modal) // so can be re-subscribed if error
  }

  subscribeModalDelete(modal) {
    modal.componentInstance.confirmClicked
      .pipe(
        switchMap(() => {
          modal.componentInstance.buttonsEnabled = false
          return this.documentsService.delete(this.document,"delete_document")
        })
      )
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe({
        next: () => {
          modal.close()
          this.close()
        },
        error: (error) => {
          this.toastService.showError($localize`Error deleting document`, error)
          modal.componentInstance.buttonsEnabled = true
          this.subscribeModalDelete(modal)
        },
      })
  }

  moreLike() {
    this.documentListViewService.quickFilter([
      {
        rule_type: FILTER_FULLTEXT_MORELIKE,
        value: this.documentId.toString(),
      },
    ])
  }

  redoOcr() {
    let modal = this.modalService.open(ConfirmDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.title = $localize`Redo OCR confirm`
    modal.componentInstance.messageBold = $localize`This operation will permanently redo OCR for this document.`
    modal.componentInstance.message = $localize`This operation cannot be undone.`
    modal.componentInstance.btnClass = 'btn-danger'
    modal.componentInstance.btnCaption = $localize`Proceed`
    modal.componentInstance.confirmClicked.subscribe(() => {
      modal.componentInstance.buttonsEnabled = false
      this.documentsService
        .bulkEdit([this.document.id], 'redo_ocr', {})
        .subscribe({
          next: () => {
            this.toastService.showInfo(
              $localize`Redo OCR operation will begin in the background. Close and re-open or reload this document after the operation has completed to see new content.`
            )
            if (modal) {
              modal.close()
            }
          },
          error: (error) => {
            if (modal) {
              modal.componentInstance.buttonsEnabled = true
            }
            this.toastService.showError(
              $localize`Error executing operation`,
              error
            )
          },
        })
    })
  }

  hasNext() {
    return this.documentListViewService.hasNext(this.documentId)
  }

  hasPrevious() {
    return this.documentListViewService.hasPrevious(this.documentId)
  }

  nextDoc() {
    this.documentListViewService
      .getNext(this.document.id)
      .subscribe((nextDocId: string) => {
        this.router.navigate(['documents', nextDocId])
      })
  }

  previousDoc() {
    this.documentListViewService
      .getPrevious(this.document.id)
      .subscribe((prevDocId: string) => {
        this.router.navigate(['documents', prevDocId])
      })
  }

  pdfPreviewLoaded(pdf: PDFDocumentProxy) {
    this.previewNumPages = pdf.numPages
    if (this.password) this.requiresPassword = false
  }

  onError(event) {
    if (event.name == 'PasswordException') {
      this.requiresPassword = true
    }
  }

  onPasswordKeyUp(event: KeyboardEvent) {
    if ('Enter' == event.key) {
      this.password = (event.target as HTMLInputElement).value
    }
  }

  get showPermissions(): boolean {
    return (
      this.permissionsService.currentUserCan(
        PermissionAction.View,
        PermissionType.User
      ) && this.userIsOwner
    )
  }

   get notesEnabled(): boolean {
    return   (
      this.settings.get(SETTINGS_KEYS.NOTES_ENABLED) &&
      this.permissionsService.currentUserCan(
        PermissionAction.View,
        PermissionType.Note
      )
    )   } 

  notesUpdated(notes: PaperlessDocumentNote[]) {
    console.log(this.document.notes)
    this.document.notes = notes
    this.openDocumentService.refreshDocument(this.documentId)
  }

  get userIsOwner(): boolean {
    let doc: PaperlessDocument = Object.assign({}, this.document)
    // dont disable while editing
    if (this.document && this.store?.value.permissions_form?.owner) {
      doc.owner = this.store?.value.permissions_form?.owner
    }
    return !this.document || this.permissionsService.currentUserOwnsObject(doc)
  }

  get userCanEdit(): boolean {
<<<<<<< HEAD
   let doc: PaperlessDocument = Object.assign({}, this.document)
=======
  /*   debugger
    let doc: PaperlessDocument = Object.assign({}, this.document)
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd
    // dont disable while editing
    if (this.document && this.store?.value.permissions_form?.owner) {
      doc.owner = this.store?.value.permissions_form?.owner
    }
    return (
      !this.document ||
      this.permissionsService.currentUserHasObjectPermissions(
        PermissionAction.Change,
        doc
      )
    ) 
    //return true
  }

  filterDocuments(items: ObjectWithId[] | NgbDateStruct[]) {
    const filterRules: FilterRule[] = items.flatMap((i) => {
      if (i.hasOwnProperty('year')) {
        const isoDateAdapter = new ISODateAdapter()
        const dateAfter: Date = new Date(isoDateAdapter.toModel(i))
        dateAfter.setDate(dateAfter.getDate() - 1)
        const dateBefore: Date = new Date(isoDateAdapter.toModel(i))
        dateBefore.setDate(dateBefore.getDate() + 1)
        // Created Date
        return [
          {
            rule_type: FILTER_CREATED_AFTER,
            value: dateAfter.toISOString().substring(0, 10),
          },
          {
            rule_type: FILTER_CREATED_BEFORE,
            value: dateBefore.toISOString().substring(0, 10),
          },
        ]
      } else if (i.hasOwnProperty('last_correspondence')) {
        // Correspondent
        return {
          rule_type: FILTER_CORRESPONDENT,
          value: (i as PaperlessCorrespondent).id.toString(),
        }
      } else if (i.hasOwnProperty('path')) {
        // Storage Path
        return {
          rule_type: FILTER_STORAGE_PATH,
          value: (i as PaperlessStoragePath).id.toString(),
        }
      } else if (i.hasOwnProperty('is_inbox_tag')) {
        // Tag
        return {
          rule_type: FILTER_HAS_TAGS_ALL,
          value: (i as PaperlessTag).id.toString(),
        }
      } else {
        // Document Type, has no specific props
        return {
          rule_type: FILTER_DOCUMENT_TYPE,
          value: (i as PaperlessDocumentType).id.toString(),
        }
      }
    })

    this.documentListViewService.quickFilter(filterRules)
  }

  private getCustomFields() {

    this.customFieldsService
      .listAllCustom("list_customfield")
      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe((result) => (this.customFields = result.results))
  }

  public refreshCustomFields() {
    this.customFieldsService.clearCache()
    this.getCustomFields()
  }

  public getCustomFieldFromInstance(
    instance: PaperlessCustomFieldInstance
  ): PaperlessCustomField {
    return this.customFields?.find((f) => f.id === instance.field)
  }

  public getCustomFieldError(index: number) {
    const fieldError = this.error?.custom_fields?.[index]
    return fieldError?.['non_field_errors'] ?? fieldError?.['value']
  }
  private updateFormForCustomFieldsForExtractData(emitEvent: boolean = false) {
    this.CutomFieldsFormFieldsForExtractData.clear({ emitEvent: false })
    this.document.custom_fields?.forEach((fieldInstance) => {
      this.CutomFieldsFormFieldsForExtractData.push(
        new FormGroup({
          field: new FormControl(
            this.getCustomFieldFromInstance(fieldInstance)?.id
          ),
          value: new FormControl(fieldInstance.value),
        }),
        { emitEvent }
      )
    })
  }
  private updateFormForCustomFields(emitEvent: boolean = false) {
   this.customFieldFormFields.clear({ emitEvent: false })
    console.log(this.customFieldFormFields);
    
        this.document.custom_fields?.forEach((fieldInstance) => {
      this.customFieldFormFields.push(
        new FormGroup({
          field: new FormControl(
            this.getCustomFieldFromInstance(fieldInstance)?.id
          ),
          value: new FormControl(fieldInstance.value),
        }),
        { emitEvent }
      )
    })
    console.log(this.customFieldFormFields);
    
  }

  public addField(field: PaperlessCustomField) {
    console.log(field);
    const customfiled = {
      field: field.id,
      value: null,
      document: this.documentId,
      created: new Date()
    }
    console.log(customfiled);
    /* this.document.custom_fields = [] */
    console.log( 
      (this.document.custom_fields == null
        
      ));
    this.document.custom_fields.push({
      field: field.id,
      value: null,
      document: this.documentId,
      created: new Date()
    })
    console.log( 
      (this.document.custom_fields.length
        
      ));
    
    
    this.updateFormForCustomFields(true)
  }

  public removeField(fieldInstance: PaperlessCustomFieldInstance) {
    this.document.custom_fields.splice(
      this.document.custom_fields.indexOf(fieldInstance),
      1
    )
    this.updateFormForCustomFields(true)
    this.documentForm.updateValueAndValidity()
  }
}