import { Component } from '@angular/core';
enum SettingsNavIDs {
  GeneralSettings = 1,
 
}

@Component({
  selector: 'pngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent {
  SettingsNavIDs = SettingsNavIDs
}
