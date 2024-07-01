import { ObjectWithId } from './object-with-id'
import { DocumentSource } from './paperless-consumption-template'
import { PaperlessDocument } from './paperless-document'


export enum PaperlessTaskType {
  // just file tasks, for now
  File = 'file',
}

<<<<<<< HEAD
export enum DocumentSource {
  ConsumeFolder = 1,
 ApiUpload = 2,
 MailFetch = 3,
=======
export enum PaperlessTaskStatus {
  Pending = 'PENDING',
  Started = 'STARTED',
  Complete = 'SUCCESS',
  Failed = "Failed",
  
}
export enum Problem
{
    NoOwner = 1,
    NoCorrespondent = 2,
    NoOwnerNoCorrespondent = 3,
    None=4
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd
}

export interface PaperlessTask extends ObjectWithId {
  type: PaperlessTaskType

<<<<<<< HEAD
  source: DocumentSource
=======
  status: PaperlessTaskStatus
  task_problem : Problem
  source: DocumentSource
  task_document : PaperlessDocument
>>>>>>> f54012f75dc7546890ad917257a61b1c305de0bd

  acknowledged: boolean

  task_id: string

  task_file_name: string

  date_created: Date

  date_done?: Date

  result?: string

  related_document?: number
}
