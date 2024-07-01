import { ObjectWithId } from './object-with-id'

export enum PaperlessCustomFieldDataType {
  STRING = 0,
  URL = 1,
  DATE = 2,
  BOOLEAN = 3,
  INTEGER = 4,
  FLOAT = 5,
  MONETARY = 6,
}

export const DATA_TYPE_LABELS = [
  {
    id: PaperlessCustomFieldDataType.BOOLEAN,
    name:`Boolean`,
  },
  {
    id: PaperlessCustomFieldDataType.DATE,
    name: `Date`,
  },
  {
    id: PaperlessCustomFieldDataType.INTEGER,
    name:`Integer`,
  },
  {
    id: PaperlessCustomFieldDataType.FLOAT,
    name: `Number`,
  },
  {
    id: PaperlessCustomFieldDataType.MONETARY,
    name: `Monetary`,
  },
  {
    id: PaperlessCustomFieldDataType.STRING,
    name: `Text`,
  },
  {
    id: PaperlessCustomFieldDataType.URL,
    name: `Url`,
  },
]

export interface PaperlessCustomField extends ObjectWithId {
  data_type: PaperlessCustomFieldDataType
  name: string
  created?: Date
}
