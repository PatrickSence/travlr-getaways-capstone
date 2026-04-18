import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewDataService } from '../services/view-data.service';
import { TripView } from '../models/trip-view';

@Component({
  selector: 'app-views',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './views.html',
  styleUrls: ['./views.css']
})
export class ViewsComponent implements OnInit {
  views: TripView[] = [];
  message = '';
  isLoading = true;

  constructor(
    private viewService: ViewDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadViews();
  }

  loadViews(): void {
    this.isLoading = true;
    this.message = '';

    this.viewService.getViews().subscribe({
      next: (data: TripView[]) => {
        console.log('Views returned to Angular:', data);
        this.views = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading views:', err);
        this.message = 'Unable to load views.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}