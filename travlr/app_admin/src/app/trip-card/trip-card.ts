import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.html',
  styleUrls: ['./trip-card.css']
})
export class TripCardComponent {
  @Input() trip!: Trip;

  constructor(private router: Router) {}

  ngOnInit(): void {
  }
  public editTrip(tripCode: string): void {
    localStorage.removeItem('tripCode');
    localStorage.setItem('tripCode', tripCode);
    this.router.navigate(['/edit-trip']);
  }
}
