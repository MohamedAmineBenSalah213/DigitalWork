import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map, publishReplay, refCount } from 'rxjs/operators'
import { ObjectWithId } from 'src/app/data/object-with-id'
import { PaperlessCustomField } from 'src/app/data/paperless-custom-field'
import { Results } from 'src/app/data/results'
import { environment } from 'src/environments/environment'

export abstract class AbstractPaperlessService<T extends ObjectWithId> {
  protected baseUrl: string = environment.apiBaseUrl
  constructor(
    protected http: HttpClient,
    protected resourceName: string,
  ) {}

  protected getResourceUrl(id: string = null, action: string = null): string {
    let url = `${this.baseUrl}/${this.resourceName}/`
    if (action) {
      url += `${action}`
    }
    if (id !== null) {
      url += `/${id}`
    }
    return url
  }

  private getOrderingQueryParam(sortField: string, sortReverse: boolean) {
    if (sortField) {
      return (sortReverse ? '-' : '') + sortField
    } else {
      return null
    }
  }

  list(
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortReverse?: boolean,
    path?:string,
    id?:string,
    extraParams?
  ): Observable<Results<T>> {
    let httpParams = new HttpParams()
    if (page) {
      httpParams = httpParams.set('page', page.toString())
    }
    if (pageSize) {
      httpParams = httpParams.set('pageSize', pageSize.toString())
    } 
    let ordering = this.getOrderingQueryParam(sortField, sortReverse)
    if (ordering) {
      httpParams = httpParams.set('ordering', ordering)
    } 
    if(id){
      httpParams = httpParams.set('owner', id)
    }
     for (let extraParamKey in extraParams) {
      if (extraParams[extraParamKey] != null) {
        httpParams = httpParams.set(extraParamKey, extraParams[extraParamKey])
      }
    }    
    return this.http.get<Results<T>>(this.getResourceUrl(null,path)  , {
      params: httpParams,
    } );
  }

  private _listAll: Observable<Results<T>>

  listAll(
    sortField?: string,
    sortReverse?: boolean,
    path?:string, 
    extraParams?
  ): Observable<Results<T>> {
    if (!this._listAll) {
      this._listAll = this.list(
        1,
        100000,
        sortField,
        sortReverse,
        path,
        extraParams
      ).pipe(publishReplay(1), refCount())
    }
    return this._listAll
  }
  listAllCustom(action?: string): Observable<Results<T>> {
    return this.http.get<T[]>(this.getResourceUrl(null, action)).pipe(
      map(data => {
        // Assuming Results<PaperlessCustomField> structure has count, results, and all properties
        const results: Results<T> = {
          count: data.length,
          results: data,
          all: null ,
        };
        return results;
      })
    );
  }
  

  getCached(id: string,action:string): Observable<T> {
    return this.listAll(null,null,action,null).pipe(
      map((list) => list.results.find((o) => o.id === id))
    )
  }

  getCachedMany(ids: string[]): Observable<T[]> {
    return this.listAll().pipe(
      map((list) => ids.map((id) => list.results.find((o) => o.id === id)))
    )
  }

  clearCache() {
    this._listAll = null
  }

  get(id: string): Observable<T> {
    return this.http.get<T>(this.getResourceUrl(id))
  }
  getlist(action:string, id: string): Observable<T> {
    return this.http.get<T>(this.getResourceUrl(id,action))
  }

  create(o: T,action?:string): Observable<any> {
    this.clearCache()
  
   return this.http.post(this.getResourceUrl(o.id,action),o)
    
    
  }

  delete(o: T,action?:string): Observable<any> {
    this.clearCache()
    return this.http.delete(this.getResourceUrl(o.id,action))
  }

  update(o: T,action?:string): Observable<T> {
    this.clearCache()
    return this.http.put<T>(this.getResourceUrl(o.id,action), o)
  }

  patch(o: T): Observable<T> {
    this.clearCache()
    return this.http.patch<T>(this.getResourceUrl(o.id), o)
  }
}
