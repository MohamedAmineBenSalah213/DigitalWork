import { TestBed } from '@angular/core/testing';

import { FileShareService } from './file-share.service';

describe('FileShareService', () => {
  let service: FileShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
