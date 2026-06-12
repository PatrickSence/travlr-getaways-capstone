import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TripCardComponent } from '../trip-card/trip-card';
import { Trip } from '../models/trip';
import { TripDataService, TripSearchResponse } from '../services/trip-data';
import { AuthenticationService } from '../services/authentication';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCardComponent, FormsModule],
  templateUrl: './trip-listing.html',
  styleUrls: ['./trip-listing.css']
})
export class TripListingComponent implements OnInit {
  trips: Trip[] = [];
  message = 'Loading trips...';

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthenticationService
  ) {
    console.log('trip-listing constructor');
  }

  public isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  addTrip(): void {
    this.router.navigate(['/add-trip']);
  }

  ngOnInit(): void {
    console.log('ngOnInit');
    this.loadTrips();
  }

  loadTrips(): void {
    this.tripDataService.getTrips().subscribe({
      next: (value: Trip[] | TripSearchResponse) => {
        if (Array.isArray(value)) {
          this.trips = value;

          this.message =
            value.length > 0
              ? `There are ${value.length} trips available.`
              : 'There were no trips retrieved from the database';
        } else {
          this.trips = value.results;

          this.message =
            value.totalMatches > 0
              ? `There are ${value.totalMatches} matching trips available.`
              : 'There were no matching trips retrieved from the database';
        }

        this.cdr.markForCheck();
        console.log(this.message);
      },
      error: (error: any) => {
        console.log('Error:', error);
        this.message = 'Error loading trips';
        this.trips = [];
        this.cdr.markForCheck();
      }
    });
  }
}