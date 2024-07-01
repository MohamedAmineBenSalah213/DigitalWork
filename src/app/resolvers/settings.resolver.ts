import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SettingsService } from '../services/settings.service';



@Injectable({
  providedIn: 'root'
})
export class SettingsResolver implements Resolve<any> {
  constructor(private settingsService: SettingsService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.settingsService.initializeSettings();
  }
}