import { Directive, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import {
  MATCHING_ALGORITHMS,
  MATCH_ALL,
  MATCH_AUTO,
  MATCH_NONE,
} from 'src/app/data/matching-model'
import { ObjectWithId } from 'src/app/data/object-with-id'
import { ObjectWithPermissions } from 'src/app/data/object-with-permissions'
import { PaperlessUser } from 'src/app/data/paperless-user'
import { AbstractPaperlessService } from 'src/app/services/rest/abstract-paperless-service'
import { UserService } from 'src/app/services/rest/user.service'
import { PermissionsFormObject } from '../input/permissions/permissions-form/permissions-form.component'
import { SettingsService } from 'src/app/services/settings.service'
import { SETTINGS_KEYS } from 'src/app/data/paperless-uisettings'


export enum EditDialogMode {
  CREATE = 0,
  EDIT = 1,
}

@Directive()
export abstract class EditDialogComponent<
  T extends /* ObjectWithPermissions | */ ObjectWithId,
> implements OnInit
{
  constructor(
    protected service: AbstractPaperlessService<T>,
    private activeModal: NgbActiveModal,
    private userService: UserService,
    private settingsService: SettingsService,
   
   
  ) {}

  users: PaperlessUser[]
  private oidcSecurityService: OidcSecurityService
  @Input()
  dialogMode: EditDialogMode = EditDialogMode.CREATE

  @Input()
  object: T

  @Output()
  succeeded = new EventEmitter()

  @Output()
  failed = new EventEmitter()

  networkActive = false

  closeEnabled = false

  error = null

  abstract getForm(): FormGroup
 id:string
  objectForm: FormGroup = this.getForm()

  ngOnInit(): void {
    this.oidcSecurityService
    .getUserData()
    .subscribe((userInfo: any) => {
      console.log('User Info:', userInfo);
      // Access specific claims (e.g., email, sub, etc.)
      this.id = userInfo.sub;
    });
    
     if (this.object != null) {
      if (this.object['permissions']) {
        /* debugger
        console.log(this.object['permissions']); */
        
        this.object['user_permissions'] = this.object['permissions']
      }

      this.object['permissions_form'] = {
        owner: this.id,//(this.object as ObjectWithPermissions).owner,
        set_permissions: (this.object as ObjectWithPermissions).permissions,
      }
      
      this.objectForm.patchValue(this.object)
      console.log(this.objectForm);
      
    } else {
      // defaults from settings
      this.objectForm.patchValue({
        permissions_form: {
          owner: this.settingsService.get(SETTINGS_KEYS.DEFAULT_PERMS_OWNER),
          set_permissions: {
            view: {
              users: this.settingsService.get(
                SETTINGS_KEYS.DEFAULT_PERMS_VIEW_USERS
              ),
              groups: this.settingsService.get(
                SETTINGS_KEYS.DEFAULT_PERMS_VIEW_GROUPS
              ),
            },
            change: {
              users: this.settingsService.get(
                SETTINGS_KEYS.DEFAULT_PERMS_EDIT_USERS
              ),
              groups: this.settingsService.get(
                SETTINGS_KEYS.DEFAULT_PERMS_EDIT_GROUPS
              ),
            },
          },
        },
      })
    }

    // wait to enable close button so it doesnt steal focus from input since its the first clickable element in the DOM
    setTimeout(() => {
      this.closeEnabled = true
    })

    this.userService.listAllCustom("list_user").subscribe((r) => {
      this.users = r.results
    }) 
  }

  getCreateTitle() {
    return $localize`Create new item`
  }

  getEditTitle() {
    return $localize`Edit item`
  }

  getTitle() {
    switch (this.dialogMode) {
      case EditDialogMode.CREATE:
        return this.getCreateTitle()
      case EditDialogMode.EDIT:
        return this.getEditTitle()
      default:
        break
    }
  }

  getMatchingAlgorithms() {
    return MATCHING_ALGORITHMS
  }

  get patternRequired(): boolean {
    return (
      this.objectForm?.value.matching_algorithm !== MATCH_AUTO &&
      this.objectForm?.value.matching_algorithm !== MATCH_NONE
    )
  }
   abstract getAction()
   abstract getActionupdate()
   splitIntoList(input: string): string[] {
    // Remove spaces and commas from the input string
   // let cleanedInput = input.replace(/[,\s]+/g, '');
 
    // Split the cleaned input into words based on word boundaries
  let words = input.split(/\s+/).filter(word => word !== '' && word !== ',');
 
    return words;
}
  save() {
    debugger
    this.error = null
     const formValues = Object.assign({}, this.objectForm.value)
    const permissionsObject: PermissionsFormObject =
      this.objectForm.get('permissions_form')?.value
    if (permissionsObject) {
      formValues.owner = permissionsObject.owner
      formValues.set_permissions = permissionsObject.set_permissions
      delete formValues.permissions_form
    }  

    var newObject = Object.assign(Object.assign({}, this.object), formValues)
    
    var serverResponse: Observable<T>
    switch (this.dialogMode) {
      case EditDialogMode.CREATE:
        debugger
         if (newObject.matching_algorithm== MATCH_AUTO){
           if(newObject.ExtractedData)
            {
              console.log(newObject.ExtractedData);
              
            }
<<<<<<< HEAD
       
          /* const userData = sessionStorage.getItem('0-angularclient');
          if (userData) {
            // Parse the JSON string into an object
    const tokenObject = JSON.parse(userData);
 
    // Extract the access token
    const id = tokenObject?.userData?.sub;
         //   const user = JSON.parse(userData);
            
          newObject.owner = id; */
          
=======
          newObject.DocumentTags = [];
          const userData = sessionStorage.getItem('0-angularclient');
        if (userData) {
              // Parse the JSON string into an object
         const tokenObject = JSON.parse(userData); 
         // Extract the access token
         const id = tokenObject?.userData?.sub;
         newObject.owner = id;
        }
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd
          serverResponse = this.service.create(newObject,this.getAction())
         }

        if(newObject.matching_algorithm in MATCHING_ALGORITHMS && newObject.matching_algorithm!= MATCH_AUTO ){

          if(newObject.match!=""){
          newObject.match = this.splitIntoList(newObject.match); 
          console.log(newObject.match) 
          }
          else
           newObject.match=[]
   
<<<<<<< HEAD
        console.log(newObject);
       /*  const userData = sessionStorage.getItem('0-angularclient');
        if (userData) {
          // Parse the JSON string into an object
  const tokenObject = JSON.parse(userData);

  // Extract the access token
  const id = tokenObject?.userData?.sub;
       //   const user = JSON.parse(userData);
          
        newObject.owner = id; 
        }*/
        
=======
        //console.log(newObject);
        const userData = sessionStorage.getItem('0-angularclient');
        if (userData) {
              // Parse the JSON string into an object
         const tokenObject = JSON.parse(userData); 
         // Extract the access token
         const id = tokenObject?.userData?.sub;
         newObject.owner = id;
        }
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd
        serverResponse = this.service.create(newObject,this.getAction())
        }
        else{
          serverResponse = this.service.create(newObject,this.getAction())
        } 
        console.log(serverResponse)
        break
      case EditDialogMode.EDIT:
       // debugger
        if(newObject.matching_algorithm in MATCHING_ALGORITHMS && newObject.matching_algorithm!= MATCH_NONE){
            if(newObject.match){
            newObject.match = this.splitIntoList(newObject.match); 
            }
       const userData = sessionStorage.getItem('0-angularclient');
        if (userData) {
              // Parse the JSON string into an object
         const tokenObject = JSON.parse(userData); 
         // Extract the access token
         const id = tokenObject?.userData?.sub;
         newObject.owner = id;
        }
        console.log(this.getActionupdate())
        serverResponse = this.service.update(newObject,this.getActionupdate())
        }
        if(newObject.matching_algorithm== MATCH_NONE){
          newObject.match= [];
          const userData = sessionStorage.getItem('0-angularclient');
        if (userData) {
              // Parse the JSON string into an object
         const tokenObject = JSON.parse(userData); 
         // Extract the access token
         const id = tokenObject?.userData?.sub;
         newObject.owner = id;
        }
           console.log(this.getActionupdate())
          serverResponse = this.service.update(newObject,this.getActionupdate())
        }
        else{
          serverResponse = this.service.update(newObject,this.getActionupdate())
        }
      default:
        break
    }
    this.networkActive = true
    serverResponse.subscribe({
      next: (result) => {
        this.activeModal.close()
        this.succeeded.emit(result)
      },
      error: (error) => {
        this.error = error.error
        this.networkActive = false
        this.failed.next(error)
      },
    })
  }

  cancel() {
    this.activeModal.close()
  }
  getUserSub(): string | null {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.sub;
    }
    return null;
  }
}
