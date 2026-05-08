import { TestBed } from '@angular/core/testing';

import { ViewDataService } from './view-data.service';

describe('ViewDataService', () => {
  let service: ViewDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
