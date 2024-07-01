import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject, first, takeUntil } from 'rxjs';


import { ToastService } from 'src/app/services/toast.service';
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component';
import { ComponentWithPermissions } from '../../with-permissions/with-permissions.component';
import { EditDialogMode } from '../../common/edit-dialog/edit-dialog.component';
import { FileShareEditDialogComponent } from '../../common/edit-dialog/file-share-edit-dialog/file-share-edit-dialog.component';
import { FileShare } from 'src/app/data/file-share';
import { FileShareService } from 'src/app/services/rest/file-share.service';
enum SettingsNavIDs {
  GeneralSettings = 1,
}
@Component({
  selector: 'pngx-file-share-list',
  templateUrl: './file-share-list.component.html',
  styleUrls: ['./file-share-list.component.scss']
})
export class FileShareListComponent 
extends ComponentWithPermissions
implements OnInit {
  SettingsNavIDs = SettingsNavIDs;
  shareFiles: FileShare[] = [];
  unsubscribeNotifier: Subject<any> = new Subject();
  data: FileShare[] = [];
  // private data: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  // myVariable$ = this.data.asObservable();

  constructor(
    public fileshareService: FileShareService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.fileshareService
      .listAll(null, null, 'show_all_share_files', { full_perms: true })

      .pipe(first(), takeUntil(this.unsubscribeNotifier))
      .subscribe({
        next: (r) => {
          this.shareFiles = r.results;
          this.data = this.shareFiles;
          this._changeDetectorRef.markForCheck();
          this.processData();
          console.log('AAAAAAAAAAAAAAAAAAAA : ', this.shareFiles);
        },
        error: (e) => {
          this.toastService.showError(
            $localize`Error retrieving share Files`,
            e
          );
        },
      });
    console.log('DATAAAAAA outside: ', this.data);
  }

  processData() {
    console.log('DATAAAAAA : ', this.data);
    // Any other code that depends on this.data can go here
  }

  deleteShareFile(rule: FileShare) {
    const modal = this.modalService.open(ConfirmDialogComponent, {
      backdrop: 'static',
    });
    modal.componentInstance.title = $localize`Confirm delete mail rule`;
    modal.componentInstance.messageBold = $localize`This operation will permanently delete this File Share.`;
    modal.componentInstance.message = $localize`This operation cannot be undone.`;
    modal.componentInstance.btnClass = 'btn-danger';
    modal.componentInstance.btnCaption = $localize`Proceed`;
    modal.componentInstance.confirmClicked.subscribe(() => {
      modal.componentInstance.buttonsEnabled = false;
      this.fileshareService.delete(rule).subscribe({
        next: () => {
          modal.close();
          this.toastService.showInfo($localize`Deleted file share`);
          this.fileshareService.clearCache();
          this.fileshareService
            .listAll(null, null, 'show_all_share_files', { full_perms: true })
            .subscribe((r) => {
              this.shareFiles = r.results;
            });
        },
        error: (e) => {
          this.toastService.showError($localize`Error deleting File Share.`, e);
        },
      });
    });
  }

  editShareFile(rule: FileShare = null) {
    const modal = this.modalService.open(FileShareEditDialogComponent, {
      backdrop: 'static',
      size: 'xl',
    });
    modal.componentInstance.dialogMode = rule
      ? EditDialogMode.EDIT
      : EditDialogMode.CREATE;
    modal.componentInstance.object = rule;
    modal.componentInstance.succeeded
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe((newFileShare) => {
        this.toastService.showInfo(
          $localize`Saved file share "${newFileShare.name}".`
        );
        this.fileshareService.clearCache();
        this.fileshareService
          .listAll(null, null, 'show_all_share_files', { full_perms: true })
          .subscribe((r) => {
            this.shareFiles = r.results;
          });
      });
    modal.componentInstance.failed
      .pipe(takeUntil(this.unsubscribeNotifier))
      .subscribe((e) => {
        this.toastService.showError($localize`Error saving file share.`, e);
      });
  }
}
