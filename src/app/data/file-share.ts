import { ObjectWithPermissions } from './object-with-permissions';

export interface FileShare extends ObjectWithPermissions {
  FolderPath: string;
  ShareName: string;
  Username: string;
  Password: string;
}