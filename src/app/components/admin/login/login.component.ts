import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
 
@Component({
  selector: 'pngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  title = '';
  userData$: any;
  isAuthenticated = false;
  user_info: any;
  user_email: any;
  token: any;
 
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private router: Router
  ) {
    console.log('AppComponent STARTING');
  }
 
  ngOnInit(): void {
   /*  this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      console.log('app authenticated', isAuthenticated);
 
      if (isAuthenticated) {
        // If authenticated, redirect to the success component
        this.router.navigate(['/dashboard']);
      }
 
      this.user_info = this.oidcSecurityService
        .getUserData()
        .subscribe((userInfo: any) => {
          console.log('User Info:', userInfo);
          // Access specific claims (e.g., email, sub, etc.)
          this.user_email = userInfo.email;
        });
 
      this.oidcSecurityService.getIdToken().subscribe((idToken: string) => {
        console.log('ID Token:', idToken);
 
        // const decodedToken = this.decodeToken(idToken);
        // console.log('Decoded Token:', decodedToken);
      });
 
      // this.oidcSecurityService
      //   .getAccessToken()
      //   .subscribe((accesstoken: string) => {
      //     console.log('access token : ', accesstoken);
      //   });
    }); */
  }
 
  // private decodeToken(token: string): any {
  //   try {
  //     // Use jwt-decode to decode the token
  //     return jwtDecode(token);
  //   } catch (error) {
  //     console.error('Error decoding token:', error);
  //     return null;
  //   }
  // }
 
  login(): void {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }
 
  forceRefreshSession() {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.warn(result));
  }
 
  logout() {
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log('okkk', result));
  }
}