import {
  Directive,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import {
  MatchingModel,
  MATCHING_ALGORITHMS,
  MATCH_AUTO,
  MATCH_NONE,
} from 'src/app/data/matching-model'
import { ObjectWithId } from 'src/app/data/object-with-id'
import {
  ObjectWithPermissions,
  PermissionsObject,
} from 'src/app/data/object-with-permissions'
import {
  SortableDirective,
  SortEvent,
} from 'src/app/directives/sortable.directive'
import { DocumentListViewService } from 'src/app/services/document-list-view.service'
import {
  PermissionsService,
  PermissionType,
} from 'src/app/services/permissions.service'
import { AbstractNameFilterService } from 'src/app/services/rest/abstract-name-filter-service'
import { ToastService } from 'src/app/services/toast.service'
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component'
import { EditDialogMode } from '../../common/edit-dialog/edit-dialog.component'
import { ComponentWithPermissions } from '../../with-permissions/with-permissions.component'
import { PermissionsDialogComponent } from '../../common/permissions-dialog/permissions-dialog.component'
import { OidcSecurityService } from 'angular-auth-oidc-client'

export interface ManagementListColumn {
  key: string

  name: string

  valueFn: any

  rendersHtml?: boolean
}

@Directive()
export abstract class ManagementListComponent<T extends ObjectWithId>
  extends ComponentWithPermissions
  implements OnInit, OnDestroy
{
  isAuthenticated: any
  id: any
  constructor(
    private service: AbstractNameFilterService<T>,
    private modalService: NgbModal,
    private editDialogComponent: any,
    private toastService: ToastService,
    private documentListViewService: DocumentListViewService,
    private permissionsService: PermissionsService,
    private oidcSecurityService: OidcSecurityService,
    protected filterRuleType: number,
    public typeName: string,
    public typeNamePlural: string,
    public permissionType: PermissionType,
    public actionpath :string,
    
    public extraColumns: ManagementListColumn[]
  ) {
    super()
    this.action=actionpath
  }

  @ViewChildren(SortableDirective) headers: QueryList<SortableDirective>

  public data: T[] = []

  public page = 1
  public action: string

  public collectionSize = 0

  public sortField: string
  public sortReverse: boolean

  public isLoading: boolean = false

  private nameFilterDebounce: Subject<string>
  private unsubscribeNotifier: Subject<any> = new Subject()
  private _nameFilter: string

  public selectedObjects: Set<string> = new Set()

  ngOnInit(): void {
    this.reloadData()

    this.nameFilterDebounce = new Subject<string>()

    this.nameFilterDebounce
      .pipe(
        takeUntil(this.unsubscribeNotifier),
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((title) => {
        this._nameFilter = title
        this.page = 1
        this.reloadData()
      })
  }

  ngOnDestroy() {
    this.unsubscribeNotifier.next(true)
    this.unsubscribeNotifier.complete()
  }

  getMatching(o: MatchingModel) {
          if (o.matching_algorithm == MATCH_AUTO) {
      return $localize`Automatic`
    } else if (o.matching_algorithm == MATCH_NONE) {
      return $localize`None`
    } else if (o.match && o.match.length > 0) {
      return `${
        MATCHING_ALGORITHMS.find((a) => a.id == o.matching_algorithm).shortName
      }: ${o.match}`
    } else {
      return '-'
    }
  }

  onSort(event: SortEvent) {
    this.sortField = event.column
    this.sortReverse = event.reverse
    this.reloadData()
  }

  reloadData() {
    this.isLoading = true
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      console.log('app authenticated', isAuthenticated);
    });
    if (this.isAuthenticated) {
    this.oidcSecurityService
   .getUserData()
   .subscribe((userInfo: any) => {
     console.log('User Info:', userInfo);
     // Access specific claims (e.g., email, sub, etc.)
     this.id = userInfo.sub;
   });
  }
    this.service
      .listFiltered(
        this.page,
        null,
        null,
        null,
        this._nameFilter,
        this.action,
        this.id,
        false
      )
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe((c) => {
        console.log(c.results);
        this.data=  c.results
        this.collectionSize = c.count
        this.isLoading = false
      })
  }

  openCreateDialog() {
    var activeModal = this.modalService.open(this.editDialogComponent, {
      backdrop: 'static',
    })
    activeModal.componentInstance.dialogMode = EditDialogMode.CREATE
    activeModal.componentInstance.succeeded.subscribe(() => {
      this.reloadData()
      this.toastService.showInfo(
        $localize`Successfully created ${this.typeName}.`
      )
    })
    activeModal.componentInstance.failed.subscribe((e) => {
      this.toastService.showError(
        $localize`Error occurred while creating ${this.typeName}.`,
        e
      )
    })
  }

  openEditDialog(object: T) {
    var activeModal = this.modalService.open(this.editDialogComponent, {
      backdrop: 'static',
    })
    activeModal.componentInstance.object = object
    activeModal.componentInstance.dialogMode = EditDialogMode.EDIT
    activeModal.componentInstance.succeeded.subscribe(() => {
      this.reloadData()
      this.toastService.showInfo(
        $localize`Successfully updated ${this.typeName}.`
      )
    })
    activeModal.componentInstance.failed.subscribe((e) => {
      this.toastService.showError(
        $localize`Error occurred while saving ${this.typeName}.`,
        e
      )
    })
  }

  abstract getDeleteMessage(object: T)
  abstract getAction()
  filterDocuments(object: ObjectWithId) {
   // debugger
    this.documentListViewService.quickFilter([
      { rule_type: this.filterRuleType, value: object.id.toString() },
    ])
  }

  openDeleteDialog(object: T) {
    var activeModal = this.modalService.open(ConfirmDialogComponent, {
      backdrop: 'static',
    })
    activeModal.componentInstance.title = $localize`Confirm delete`
    activeModal.componentInstance.messageBold = this.getDeleteMessage(object)
    activeModal.componentInstance.message = $localize`Associated documents will not be deleted.`
    activeModal.componentInstance.btnClass = 'btn-danger'
    activeModal.componentInstance.btnCaption = $localize`Delete`
    activeModal.componentInstance.confirmClicked.subscribe(() => {
      activeModal.componentInstance.buttonsEnabled = false
      console.log(object);
      this.service
        .delete(object,this.getAction())
        .pipe(takeUntil(this.unsubscribeNotifier))
        .subscribe({
          next: () => {
            activeModal.close()
            this.reloadData()
          },
          error: (error) => {
            activeModal.componentInstance.buttonsEnabled = true
            this.toastService.showError(
              $localize`Error while deleting element`,
              error
            )
          },
        })
    })
  }

  get nameFilter() {
    return this._nameFilter
  }

  set nameFilter(nameFilter: string) {
    this.nameFilterDebounce.next(nameFilter)
  }

  onNameFilterKeyUp(event: KeyboardEvent) {
    if (event.code == 'Escape') this.nameFilterDebounce.next(null)
  }

  userCanDelete(object: ObjectWithPermissions): boolean {
    return this.permissionsService.currentUserOwnsObject(object)
  }

  userCanEdit(object: ObjectWithPermissions): boolean {
    return this.permissionsService.currentUserHasObjectPermissions(
      this.PermissionAction.Change,
      object
    )
  }

  get userOwnsAll(): boolean {
    let ownsAll: boolean = true
    const objects = this.data.filter((o) => this.selectedObjects.has(o.id))
    ownsAll = objects.every((o) =>
      this.permissionsService.currentUserOwnsObject(o)
    )
    return ownsAll
  }

  toggleAll(event: PointerEvent) {
    if ((event.target as HTMLInputElement).checked) {
      this.selectedObjects = new Set(this.data.map((o) => o.id))
    } else {
      this.clearSelection()
    }
  }

  clearSelection() {
    this.selectedObjects.clear()
  }

  toggleSelected(object) {
    this.selectedObjects.has(object.id)
      ? this.selectedObjects.delete(object.id)
      : this.selectedObjects.add(object.id)
  }

  setPermissions() {
    let modal = this.modalService.open(PermissionsDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.confirmClicked.subscribe(
      (permissions: { owner: string; set_permissions: PermissionsObject }) => {
        modal.componentInstance.buttonsEnabled = false
        this.service
          .bulk_update_permissions(
            Array.from(this.selectedObjects),
            permissions
          )
          .subscribe({
            next: () => {
              modal.close()
              this.toastService.showInfo(
                $localize`Permissions updated successfully`
              )
              this.reloadData()
            },
            error: (error) => {
              modal.componentInstance.buttonsEnabled = true
              this.toastService.showError(
                $localize`Error updating permissions`,
                error
              )
            },
          })
      }
    )
  }
}
