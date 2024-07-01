import { ObjectWithId } from './object-with-id'

export const MATCH_NONE = 0
export const MATCH_ANY = 1
export const MATCH_ALL = 2
export const MATCH_LITERAL = 3
export const MATCH_REGEX = 4
export const MATCH_FUZZY = 5
export const MATCH_AUTO = 6
export const DEFAULT_MATCHING_ALGORITHM = MATCH_AUTO

export const MATCHING_ALGORITHMS = [
  {
    id: 6,
    shortName: "MATCH_AUTO",
    name: $localize`Auto: Learn matching automatically`,
  },
  {
    id: 1,
    shortName: $localize`Any word`,
    name: $localize`Any: Document contains any of these words (space separated)`,
  },
  {
    id: 2,
    shortName: $localize`All words`,
    name: $localize`All: Document contains all of these words (space separated)`,
  },
  {
    id: 3,
    shortName: $localize`Exact match`,
    name: $localize`Exact: Document contains this string`,
  },
  {
    id:4,
    shortName: $localize`Regular expression`,
    name: $localize`Regular expression: Document matches this regular expression`,
  },
  {
    id: 5,
    shortName: $localize`Fuzzy word`,
    name: $localize`Fuzzy: Document contains a word similar to this word`,
  },
  {
    id: 0,
    shortName: "None",
    name: $localize`None: Disable matching`,
  },
]

export interface MatchingModel extends ObjectWithId {
  name?: string

  slug?: string

  match?: Array<string>

  matching_algorithm?: number

  is_insensitive?: boolean

  document_count?: number
}
