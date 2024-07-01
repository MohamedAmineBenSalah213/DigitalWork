import { Component, forwardRef, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms'
import { PaperlessUser } from 'src/app/data/paperless-user'
import { AbstractInputComponent } from '../../abstract-input'
import { OidcSecurityService } from 'angular-auth-oidc-client'

export interface PermissionsFormObject {
  owner?: string
  set_permissions?: {
    view?: {
      users?: string[]
      groups?: string[]
    }
    change?: {
      users?: string[]
      groups?: string[]
    }
  }
}

@Component({
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PermissionsFormComponent),
      multi: true,
    },
  ],
  selector: 'pngx-permissions-form',
  templateUrl: './permissions-form.component.html',
  styleUrls: ['./permissions-form.component.scss'],
})
export class PermissionsFormComponent
  extends AbstractInputComponent<PermissionsFormObject>
  implements OnInit
{
  @Input()
  users: PaperlessUser[]
  username: string;
  @Input()
  accordion: boolean = false
  
  form = new FormGroup({
    owner: new FormControl(null),
    set_permissions: new FormGroup({
      view: new FormGroup({
        users: new FormControl([]),
        groups: new FormControl([]),
      }),
      change: new FormGroup({
        users: new FormControl([]),
        groups: new FormControl([]),
      }),
    }),
  })
 
  constructor(
    private oidcSecurityService: OidcSecurityService,
  ) {
    super()
  }

  ngOnInit(): void {
    debugger
   
    this.oidcSecurityService.getUserData().subscribe((userInfo: any) => {
      if (userInfo && userInfo.email) {
        console.log(userInfo.email);
        this.form.get('owner').setValue(userInfo.email);

      }
    });
   // Log the initial value of the owner field
        console.log('Owner set to:', this.form.get('owner').value);
    // Subscribe to form value changes to propagate them
    this.form.valueChanges.subscribe((value) => {
      this.onChange(value);
    });
   
    
    
  }

  writeValue(newValue: any): void {
    debugger
    this.form.patchValue(newValue, { emitEvent: false })
  }

 
}
