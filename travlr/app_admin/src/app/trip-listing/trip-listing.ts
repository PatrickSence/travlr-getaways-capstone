import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TripCardComponent } from '../trip-card/trip-card';
import { Trip } from '../models/trip';
import { TripDataService, TripSearchParams, TripSearchResponse } from '../services/trip-data';
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
  keyword = '';
  resort = '';
  maxPrice: number | null = null;
  sortBy = 'relevance';

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
    this.loadTrips();
  }

  loadTrips(params?: TripSearchParams): void {
    this.message = 'Loading trips...';

    this.tripDataService.getTrips(params).subscribe({
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
      },
      error: (error: any) => {
        this.message = 'Error loading trips';
        this.trips = [];
        this.cdr.markForCheck();
      }
    });
  }

  searchTrips(): void {
    const searchParams: TripSearchParams = {
      keyword: this.keyword.trim() || undefined,
      resort: this.resort.trim() || undefined,
      maxPrice: this.maxPrice ?? undefined,
      sortBy: this.sortBy || 'relevance'
    };

    this.loadTrips(searchParams);
  }

  resetSearch(): void {
    this.keyword = '';
    this.resort = '';
    this.maxPrice = null;
    this.sortBy = 'relevance';
    this.loadTrips();
  }
}
