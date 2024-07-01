import { ObjectWithId } from './object-with-id'

export enum DocumentSource {
  ConsumeFolder = 1,
  ApiUpload = 2,
  MailFetch = 3,
}
export enum WorkflowTriggerType {
  Consumption = 0,
  DocumentAdded = 1,
  DocumentUpdated = 2,
}

export interface PaperlessConsumptionTemplate extends ObjectWithId {
  name: string

  order: number
  type : WorkflowTriggerType
  sources: DocumentSource[]

  filter_filename: string

  filter_path?: string

  filter_mailrule?: string // MailRule.id

  match?: string

  matching_algorithm?: number

  is_insensitive?: boolean

  filter_has_tags?: string[] // Tag.id[]

  filter_has_correspondent?: string // Correspondent.id

  filter_has_document_type?: string // DocumentType.id

  assign_title?: string

  assign_tags?: number[] // Tag.id

  assign_document_type?: number // DocumentType.id

  assign_correspondent?: number // Correspondent.id

  assign_storage_path?: number // StoragePath.id

  assign_custom_fields?: number[] 

  assign_owner?: number // User.id

  assign_view_users?: number[] // [PaperlessUser.id]

  assign_view_groups?: number[] // [PaperlessGroup.id]

  assign_change_users?: number[] // [PaperlessUser.id]

  assign_change_groups?: number[] // [PaperlessGroup.id]
}
