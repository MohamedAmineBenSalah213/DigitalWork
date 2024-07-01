import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FileShare } from 'src/app/data/file-share';
import { AbstractPaperlessService } from './abstract-paperless-service';
import { Observable, combineLatest, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileShareService extends AbstractPaperlessService<FileShare> {
  loading: boolean;
  constructor(http: HttpClient) {
    super(http, 'sharefolder');
  }
  private reload() {
    this.loading = true;
    this.listAllCustom('show_all_share_files').subscribe((r) => {
      this.shareFiles = r.results;
      this.loading = false;
    });
  }

  private shareFiles: FileShare[] = [];

  get allRules() {
    return this.shareFiles;
  }

  delete(o: FileShare) {
    return super.delete(o, 'delete_share_file').pipe(tap(() => this.reload()));
  }

  create(o: FileShare) {
    return super.create(o, 'add_share_file').pipe(tap(() => this.reload()));
  }

  update(o: FileShare) {
    return super.update(o, 'update_share_file').pipe(tap(() => this.reload()));
  }

  patchMany(objects: FileShare[]): Observable<FileShare[]> {
    return combineLatest(objects.map((o) => super.patch(o))).pipe(
      tap(() => this.reload())
    );
  }

}
