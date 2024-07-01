import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { combineLatest, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PaperlessMailRule } from 'src/app/data/paperless-mail-rule'
import { AbstractPaperlessService } from './abstract-paperless-service'

@Injectable({
  providedIn: 'root',
})
export class MailRuleService extends AbstractPaperlessService<PaperlessMailRule> {
  loading: boolean

  constructor(http: HttpClient) {
    super(http, 'mailrule')
  }
  private reload() {
    this.loading = true
    this.listAllCustom("list_mailrule").subscribe((r) => {
      this.mailRules = r.results
      this.loading = false
    })
  }

  private mailRules: PaperlessMailRule[] = []

  get allRules() {
    return this.mailRules
  }

  create(o: PaperlessMailRule) {
    return super.create(o,"add_mailrule").pipe(tap(() => this.reload()))
  }

  update(o: PaperlessMailRule) {
    return super.update(o,"update_mailrule").pipe(tap(() => this.reload()))
  }

  patchMany(objects: PaperlessMailRule[]): Observable<PaperlessMailRule[]> {
    return combineLatest(objects.map((o) => super.patch(o))).pipe(
      tap(() => this.reload())
    )
  }

  delete(o: PaperlessMailRule) {
    return super.delete(o,"delete_mailrule").pipe(tap(() => this.reload()))
  }
}
