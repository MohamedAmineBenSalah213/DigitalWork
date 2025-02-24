import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { PaperlessTag } from 'src/app/data/paperless-tag'
import { TagEditDialogComponent } from '../../edit-dialog/tag-edit-dialog/tag-edit-dialog.component'
import { TagService } from 'src/app/services/rest/tag.service'
import { EditDialogMode } from '../../edit-dialog/edit-dialog.component'
import { first, firstValueFrom, tap } from 'rxjs'
import { NgSelectComponent } from '@ng-select/ng-select'

@Component({
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagsComponent),
      multi: true,
    },
  ],
  selector: 'pngx-input-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit, ControlValueAccessor {
  constructor(
    private tagService: TagService,
    private modalService: NgbModal
  ) {
    this.createTagRef = this.createTag.bind(this)
  }

  onChange = (newValue: string[]) => {}

  onTouched = () => {}

  writeValue(newValue: string[]): void {
    this.value = newValue
  }
  registerOnChange(fn: any): void {
    this.onChange = fn
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  ngOnInit(): void {
    
    this.tagService.listAll(null,null,"list_tags",null).subscribe((result) => {
      this.tags = result.results
    })
  }

  @Input()
  title = $localize`Tags`

  @Input()
  disabled = false

  @Input()
  hint

  @Input()
  suggestions: string[]

  @Input()
  allowCreate: boolean = true

  @Input()
  showFilter: boolean = false

  @Input()
  horizontal: boolean = false

  @Output()
  filterDocuments = new EventEmitter<PaperlessTag[]>()

  @ViewChild('tagSelect') select: NgSelectComponent

  value: string[] = []

  tags: PaperlessTag[] = []

  public createTagRef: (name) => void

  getTag(id: string) {
    if (this.tags) {

      return this.tags.find((tag) => tag.id === id)
    } else {
      return null
    }
  }

  removeTag(event: PointerEvent, id: string) {
    if (this.disabled) return

    // prevent opening dropdown
    event.stopImmediatePropagation()

    let index = this.value.indexOf(id)
    if (index > -1) {
      let oldValue = this.value
      oldValue.splice(index, 1)
      this.value = [...oldValue]
      this.onChange(this.value)
    }
  }

  createTag(name: string = null) {
    var modal = this.modalService.open(TagEditDialogComponent, {
      backdrop: 'static',
    })
    modal.componentInstance.dialogMode = EditDialogMode.CREATE
    if (name) modal.componentInstance.object = { name: name }
    else if (this.select.searchTerm)
      modal.componentInstance.object = { name: this.select.searchTerm }
    this.select.searchTerm = null
    this.select.detectChanges()
    return firstValueFrom(
      (modal.componentInstance as TagEditDialogComponent).succeeded.pipe(
        first(),
        tap(() => {
          this.tagService.listAll().subscribe((tags) => {
            this.tags = tags.results
          })
        })
      )
    )
  }

  getSuggestions() {
    if (this.suggestions && this.tags) {
      return this.suggestions
        .filter((id) => !this.value.includes(id))
        .map((id) => this.tags.find((tag) => tag.id == id))
    } else {
      return []
    }
  }

  addTag(id) {
    this.value = [...this.value, id]
    this.onChange(this.value)
  }

  get hasPrivate(): boolean {
    return this.value.some(
      (t) => this.tags?.find((t2) => t2.id === t) === undefined
    )
  }

  onFilterDocuments() {
    this.filterDocuments.emit(
      this.tags.filter((t) => this.value.includes(t.id))
    )
  }
}
