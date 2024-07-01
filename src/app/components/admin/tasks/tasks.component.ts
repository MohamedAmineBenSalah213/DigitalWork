import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, first, takeUntil } from 'rxjs'
import { PaperlessTask } from 'src/app/data/paperless-task'
import { TasksService } from 'src/app/services/tasks.service'
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component'
import { ComponentWithPermissions } from '../../with-permissions/with-permissions.component'
import { FixDocumentsDropdownComponent } from '../../common/fix-documents-dropdown/fix-documents-dropdown.component'
import { EditDialogMode } from '../../common/edit-dialog/edit-dialog.component'
import { ToastService } from 'src/app/services/toast.service'

@Component({
  selector: 'pngx-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent
  extends ComponentWithPermissions
  implements OnInit, OnDestroy
{
  @ViewChild('fixDropdown') fixDropdown: any;
  isDropdownVisible = false;
  public activeTab: string
  public selectedTasks: Set<string> = new Set()
  public expandedTask: string
  unsubscribeNotifier: Subject<any> = new Subject();
  public pageSize: number = 25
  public page: number = 1

  public autoRefreshInterval: any

  get dismissButtonText(): string {
    return this.selectedTasks.size > 0
      ? $localize`Dismiss selected`
      : $localize`Dismiss all`
  }

  constructor(
    public tasksService: TasksService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private readonly router: Router
  ) {
    super()
  }

  ngOnInit() {
    
    this.tasksService.reload()
    this.toggleAutoRefresh()
  }
  onFixButtonClick(event: Event): void {
    this.isDropdownVisible = !this.isDropdownVisible;
    event.stopPropagation();
  }

  ngOnDestroy() {
    this.tasksService.cancelPending()
  }

  dismissTask(task: PaperlessTask) {
    this.dismissTasks(task)
  }

  dismissTasks(task: PaperlessTask = undefined) {
    let tasks = task ? new Set([task.id]) : /* new Set(this.selectedTasks.values()) */ null
    if (!task && tasks.size == 0)
      tasks = new Set(this.tasksService.allFileTasks.map((t) => t.id))
    if (tasks.size > 1) {
      let modal = this.modalService.open(ConfirmDialogComponent, {
        backdrop: 'static',
      })
      modal.componentInstance.title = $localize`Confirm Dismiss All`
      modal.componentInstance.messageBold = $localize`Dismiss all ${tasks.size} tasks?`
      modal.componentInstance.btnClass = 'btn-warning'
      modal.componentInstance.btnCaption = $localize`Dismiss`
      modal.componentInstance.confirmClicked.pipe(first()).subscribe(() => {
        modal.componentInstance.buttonsEnabled = false
        modal.close()
        this.tasksService.dismissTasks(tasks)
        this.selectedTasks.clear()
      })
    } else {
      this.tasksService.dismissTasks(tasks)
      this.selectedTasks.clear()
    }
  }

  dismissAndGo(task: PaperlessTask) {
    this.dismissTask(task)
    this.router.navigate(['documents', task.task_document.id])
  }

  expandTask(task: PaperlessTask) {
    this.expandedTask = this.expandedTask == task.id ? undefined : task.id
  }
  fixproblem(task: PaperlessTask)
  {
    const modal = this.modalService.open(FixDocumentsDropdownComponent, {
      backdrop: 'static',
    
    }); 
    modal.componentInstance.dialogMode =  EditDialogMode.EDIT
    modal.componentInstance.task = task 
    modal.componentInstance.succeeded
    .pipe(takeUntil(this.unsubscribeNotifier))
    .subscribe((newFileShare) => {
      this.toastService.showInfo(
        $localize`Saved file share "${newFileShare.name}".`
      );
     // this.tasksService.clearCache();
      this.tasksService.reload()
      

    });
  modal.componentInstance.failed
    .pipe(takeUntil(this.unsubscribeNotifier))
    .subscribe((e) => {
      this.toastService.showError($localize`Error saving file share.`, e);
    });
  }
  toggleSelected(task: PaperlessTask) {
    this.selectedTasks.has(task.id)
      ? this.selectedTasks.delete(task.id)
      : this.selectedTasks.add(task.id)
  }

  get currentTasks(): PaperlessTask[] {
    let tasks: PaperlessTask[] = []
    switch (this.activeTab) {
      case 'queued':
        tasks = this.tasksService.queuedFileTasks
        break
      case 'started':
        tasks = this.tasksService.startedFileTasks
        break
      case 'completed':
        tasks = this.tasksService.completedFileTasks
        break
     
    }
    return tasks
  }

  toggleAll(event: PointerEvent) {
    if ((event.target as HTMLInputElement).checked) {
      debugger
      this.selectedTasks = new Set(this.currentTasks.map((t) => t.id))
      console.log(this.selectedTasks);
      
    } else {
      this.clearSelection()
    }
  }

  clearSelection() {
    this.selectedTasks.clear()
  }

  duringTabChange(navID: number) {
    this.page = 1
  }

  get activeTabLocalized(): string {
    switch (this.activeTab) {
      case 'queued':
        return $localize`queued`
      case 'started':
        return $localize`started`
      case 'completed':
        return $localize`completed`
     
    }
    console.log(this.activeTab);
    
  }

  toggleAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval)
      this.autoRefreshInterval = null
    } else {
      this.autoRefreshInterval = setInterval(() => {
        this.tasksService.reload()
      }, 5000)
    }
  }
}
