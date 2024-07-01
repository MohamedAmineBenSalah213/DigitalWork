/* import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Router } from '@angular/router';
 
@Injectable()
export class AuthInterceptorInterceptor implements HttpInterceptor {
  token: any;
  constructor(private oidcSecurityService: OidcSecurityService,private router: Router) {}
 
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    //getting the token of session storage
    this.token = sessionStorage.getItem('0-angularclient');
    // Parse the JSON string into an object
    if (!this.token) {
      // Handle the case when the token is not present
      console.error('Access token is not available.');
      this.router.navigate(['/login']);
      
      // Optionally, you can create a new request to stop further processing
      const newRequest = request.clone({
        setHeaders: {
          // Clear the Authorization header if necessary
          Authorization: ''
        }
      });
      return next.handle(request);
    }
    // Parse the JSON string into an object
    const tokenObject = JSON.parse(this.token);
 
    // Extract the access token
    const accessToken = tokenObject?.authnResult?.access_token;
 
    if (!accessToken) {
      // Handle the case when the access token is not present
      console.error('Access token is not available.');
      
      return next.handle(request);
    }
 
    console.log('access token', accessToken);
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (tokenObject?.authnResult?.expires_in == 0) {
      this.oidcSecurityService
        .forceRefreshSession()
        .subscribe((result) => console.warn(result));
    }
    return next.handle(request);
  }
} */
  import { Injectable } from '@angular/core';
  import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse,
  } from '@angular/common/http';
  import { Observable, throwError } from 'rxjs';
  import { catchError, switchMap } from 'rxjs/operators';
  import { OidcSecurityService } from 'angular-auth-oidc-client';
  import { Router } from '@angular/router';
  
  @Injectable()
  export class AuthInterceptorInterceptor implements HttpInterceptor {
    token: any;
  
    constructor(
      private oidcSecurityService: OidcSecurityService,
      private router: Router
    ) {}
  
    intercept(
      request: HttpRequest<unknown>,
      next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
      this.token = sessionStorage.getItem('0-angularclient');
  
      if (this.token) {
        const tokenObject = JSON.parse(this.token);
        const accessToken = tokenObject?.authnResult?.access_token;
  
        if (accessToken) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
  
          // Optionally handle token expiration here
          const expiresIn = tokenObject?.authnResult?.expires_in;
          if (expiresIn && this.isTokenExpired(expiresIn)) {
            return this.oidcSecurityService.forceRefreshSession().pipe(
              switchMap(() => {
                // After refreshing the session, get the new token
                const refreshedToken = sessionStorage.getItem('0-angularclient');
                const refreshedTokenObject = JSON.parse(refreshedToken);
                const newAccessToken = refreshedTokenObject?.authnResult?.access_token;
  
                if (newAccessToken) {
                  request = request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newAccessToken}`,
                    },
                  });
                }
                return next.handle(request);
              }),
              catchError((error) => {
                // Handle errors, possibly redirect to login
                this.handleAuthError();
                return throwError(error);
              })
            );
          }
        } else {
          console.error('Access token is not available.');
          this.handleAuthError();
        }
      } else {
        console.error('Access token is not available.');
        this.handleAuthError();
      }
  
      return next.handle(request).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.handleAuthError();
          }
          return throwError(error);
        })
      );
    }
  
    private isTokenExpired(expiresIn: number): boolean {
      const expirationDate = new Date().getTime() + expiresIn * 1000;
      return expirationDate < new Date().getTime();
    }
  
    private handleAuthError() {
      this.router.navigate(['/login']);
    }
  }
  