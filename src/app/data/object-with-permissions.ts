import { ObjectWithId } from './object-with-id'

export interface PermissionsObject {
  view: {
    users: Array<string>
    groups: Array<string>
  }
  change: {
    users: Array<string>
    groups: Array<string>
  }
}

export interface ObjectWithPermissions extends ObjectWithId {
  owner?: string

  permissions?: PermissionsObject

  user_can_change?: boolean
}
