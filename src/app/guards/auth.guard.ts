import { OidcSecurityService } from 'angular-auth-oidc-client';
 
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
 
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
 
@Injectable({
  providedIn: 'root',
})
export class authGuard implements CanActivate {
  isAuthenticated = false;
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private route: Router
  ) {}
 
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      console.log('app authenticated', isAuthenticated);
    });
    if (this.isAuthenticated) {
      return true;
    } else {
      this.route.navigate(['login']);
      return false;
    }
  }
}