import { ObjectWithId } from './object-with-id'
import { PaperlessCustomField } from './paperless-custom-field'

export interface PaperlessCustomFieldInstance extends ObjectWithId {
  document: string // PaperlessDocument
  field: string // PaperlessCustomField
  created: Date
  value?: any
}
