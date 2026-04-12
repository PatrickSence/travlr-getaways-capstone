import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { TripCardComponent } from '../trip-card/trip-card';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCardComponent, RouterLink],
  templateUrl: './trip-listing.html',
  styleUrls: ['./trip-listing.css']
})
export class TripListingComponent implements OnInit {
  trips: Trip[] = [];
  message = 'Loading trips...';

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('trip-listing constructor');
  }

  addTrip(): void {
    this.router.navigate(['/add-trip']);
  }

  ngOnInit(): void {
    console.log('ngOnInit');

    this.tripDataService.getTrips().subscribe({
      next: (value: Trip[]) => {
        this.trips = value;
        this.message =
          value.length > 0
            ? `There are ${value.length} trips available.`
            : 'There were no trips retrieved from the database';

        this.cdr.markForCheck();
        console.log(this.message);
      },
      error: (error: any) => {
        console.log('Error:', error);
        this.message = 'Error loading trips';
        this.cdr.markForCheck();
      }
    });
  }
}