import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingDataService } from '../services/booking-data.service';
import { Booking } from '../models/booking';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.css']
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  message = '';
  isLoading = true;

  constructor(
    private bookingService: BookingDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.message = '';

    this.bookingService.getBookings().subscribe({
      next: (data: Booking[]) => {
        console.log('Bookings returned to Angular:', data);
        this.bookings = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading bookings:', err);
        this.message = 'Unable to load bookings.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}