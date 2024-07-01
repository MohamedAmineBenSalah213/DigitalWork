import { Injectable } from '@angular/core'
import { PaperlessDocument } from 'src/app/data/paperless-document'
import { PaperlessDocumentMetadata } from 'src/app/data/paperless-document-metadata'
import { AbstractPaperlessService } from './abstract-paperless-service'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Results } from 'src/app/data/results'
import { FilterRule } from 'src/app/data/filter-rule'
import { map, tap } from 'rxjs/operators'
import { CorrespondentService } from './correspondent.service'
import { DocumentTypeService } from './document-type.service'
import { TagService } from './tag.service'
import { PaperlessDocumentSuggestions } from 'src/app/data/paperless-document-suggestions'
import { queryParamsFromFilterRules } from '../../utils/query-params'
import { StoragePathService } from './storage-path.service'
import { environment } from 'src/environments/environment'
import { FixOwnerCorrespondent } from 'src/app/data/FixOwnerCorrespondent'
import { OidcSecurityService } from 'angular-auth-oidc-client'

export const DOCUMENT_SORT_FIELDS = [
  { field: 'archive_serial_number', name: $localize`ASN` },
  { field: 'correspondent__name', name: $localize`Correspondent` },
  { field: 'title', name: $localize`Title` },
  { field: 'document_type__name', name: $localize`Document type` },
  /* { field: 'created', name: $localize`Created` }, */
  { field: 'added', name: $localize`Added` },
  { field: 'modified', name: $localize`Modified` },
  { field: 'num_notes', name: $localize`Notes` },
  { field: 'owner', name: $localize`Owner` },
]

export const DOCUMENT_SORT_FIELDS_FULLTEXT = [
  ...DOCUMENT_SORT_FIELDS,
  {
    field: 'score',
    name: $localize`:Score is a value returned by the full text search engine and specifies how well a result matches the given query:Search score`,
  },
]

export interface SelectionDataItem {
  id: number
  document_count: number
}

export interface SelectionData {
selected_storage_paths: SelectionDataItem[]
  selected_correspondents: SelectionDataItem[]
  selected_tags: SelectionDataItem[]
  selected_document_types: SelectionDataItem[]
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService extends AbstractPaperlessService<PaperlessDocument> {
  private _searchQuery: string
  isAuthenticated: boolean
  id: any

  constructor(
    http: HttpClient,
    private correspondentService: CorrespondentService,
    private documentTypeService: DocumentTypeService,
    private tagService: TagService,
    private oidcSecurityService: OidcSecurityService,
    private storagePathService: StoragePathService
  ) {
    super(http, 'document')
  }

  addObservablesToDocument(doc: PaperlessDocument) {
    //debugger
      if (doc.correspondentId) {
      doc.correspondent$ = this.correspondentService.getCached(
        doc.correspondentId,"list_correspondent"
      )
    }
    if (doc.documentTypeId) {
      doc.document_type$ = this.documentTypeService.getCached(doc.documentTypeId,"list_types")
    }
    if (doc.tags) {
      doc.tags$ = this.tagService
        .getCachedMany(doc.tags)
        .pipe(
          tap((tags) =>
            tags.sort((tagA, tagB) => tagA.name.localeCompare(tagB.name))
          )
        )
    }
   /*  if (doc.storage_path) {
      doc.storage_path$ = this.storagePathService.getCached(doc.storage_path,"")
    }  */ 
   
     return doc
   
  }

  listFiltered(
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortReverse?: boolean,
    filterRules?: FilterRule[],
    action?:string,
    iduser?:string,
    extraParams = {}
  ): Observable<Results<PaperlessDocument>> {
     return this.list(
      page,
      pageSize,
      sortField,
      sortReverse,
      action,
<<<<<<< HEAD
    null
=======
      iduser,
      Object.assign(extraParams, queryParamsFromFilterRules(filterRules))
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd
      
    ).pipe(
      map((results) => {
         results.results.forEach((doc) => this.addObservablesToDocument(doc));
         return results
      })
    ) 
   
  }
 /*  page,
  pageSize,
  sortField,
  sortReverse,
  action,
  */
 

  listAllFilteredIds(filterRules?: FilterRule[]): Observable<string[]> {
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
    return this.listFiltered(1, 100000, null, null, filterRules,null,this.id, {
      fields: 'id',
    }).pipe(map((response) => response.results.map((doc) => doc.id)))
  }

  getlist(id: string,action :string): Observable<PaperlessDocument> {
    return this.http.get<PaperlessDocument>(this.getResourceUrl(id,action))/* , {
     /*  params: {
        full_perms: true,
      }, */
    } 
  

  getPreviewUrl(id: string, original: boolean = false): string {
    let url = this.getResourceUrl(id, 'preview')
    if (this._searchQuery) url += `#search="${this._searchQuery}"`
    if (original) {
      url += '?original=true'
    }
    return url
  }

  getThumbUrl(id: string): string {
   // debugger
    return this.getResourceUrl(id, 'thumb')
  }

  getDownloadUrl(id: string, original: boolean = false): string {
    let url = this.getResourceUrl(id, 'download')
    if (original) {
      url += '?original=true'
    }
    return url
  }

  getNextAsn(): Observable<number> {
    return this.http.get<number>(this.getResourceUrl(null, 'next_asn'))
  }

  update(o: PaperlessDocument,action:string): Observable<PaperlessDocument> {
    // we want to only set created_date
    /* o.created = undefined */
    return super.update(o,action)
  }

  uploadDocument(formData : FormData, id :string) {
    const params = new HttpParams().set('id', id);
      return this.http.post(`${environment.apiBaseUrl}/document/Upload`
      ,
      formData,
      {params, reportProgress: true, observe: 'events' }
    )
  }

  getMetadata(id: string): Observable<PaperlessDocumentMetadata> {
    return this.http.get<PaperlessDocumentMetadata>(
      this.getResourceUrl(id, 'getmetadata')
    )
  }

  bulkEdit(ids: string[], method: string, args: any) {
    return this.http.post(this.getResourceUrl(null, 'bulk_edit'), {
      documents: ids,
      method: method,
      parameters: args,
    })
  }

  getSelectionData(ids: string[]): Observable<SelectionData> {
    return this.http.post<SelectionData>(
      this.getResourceUrl(null, 'selection_data'),
      { documents: ids }
    )
    }
    
    //   

  getSuggestions(id: string): Observable<PaperlessDocumentSuggestions> {
    return this.http.get<PaperlessDocumentSuggestions>(
      this.getResourceUrl(id, 'suggestions')
    )
  }

  bulkDownload(
    ids: string[],
    content = 'both',
    useFilenameFormatting: boolean = false
  ) {
    return this.http.post(
      this.getResourceUrl(null, 'bulk_download'),
      {
        documents: ids,
        content: content,
        follow_formatting: useFilenameFormatting,
      },
      { responseType: 'blob' }
    )
  }
  fixOwnerCorrespondent(id: string, document: FixOwnerCorrespondent): Observable<any> {
    return this.http.put(this.getResourceUrl(id, 'fix_owner_correspondent'),
  
     document
  );
  }

  public set searchQuery(query: string) {
    this._searchQuery = query
  }
}
