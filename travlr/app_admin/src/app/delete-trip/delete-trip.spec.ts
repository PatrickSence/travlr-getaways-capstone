import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteTrip } from './delete-trip';

describe('DeleteTrip', () => {
  let component: DeleteTrip;
  let fixture: ComponentFixture<DeleteTrip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteTrip],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteTrip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
