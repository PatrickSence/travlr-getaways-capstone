import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TripDataService } from '../services/trip-data';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-delete-trip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-trip.html',
  styleUrls: ['./delete-trip.css']
})
export class DeleteTripComponent implements OnInit {
  tripCode: string = '';
  trip: Trip | null = null;
  formError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripDataService: TripDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('DeleteTripComponent ngOnInit fired');

    this.tripCode = this.route.snapshot.paramMap.get('tripCode') || '';
    console.log('tripCode:', this.tripCode);

    if (!this.tripCode) {
      this.formError = 'No trip code found.';
      return;
    }

    this.tripDataService.getTrip(this.tripCode).subscribe({
      next: (value: any) => {
        console.log('Trip loaded:', value);

        const loadedTrip = Array.isArray(value) ? value[0] : value;
        this.trip = loadedTrip ? { ...loadedTrip } : null;

        console.log('Assigned trip:', this.trip);

        if (!this.trip) {
          this.formError = 'Trip not found.';
        }

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log('Error loading trip:', error);
        this.formError = 'Could not load trip details.';
        this.cdr.detectChanges();
      }
    });
  }

  public onDeleteSubmit(): void {
      console.log('Delete button clicked');
      console.log('tripCode:', this.tripCode);
    if (!this.tripCode) {
      this.formError = 'No trip code found.';
      return;
    }

    this.tripDataService.deleteTrip(this.tripCode).subscribe({
      next: () => {
        console.log('Delete successful:', this.tripCode);
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        console.log('Delete error:', error);
        this.formError = 'Could not delete trip.';
      }
    });
  }

  public onCancel(): void {
    this.router.navigate(['/']);
  }
}