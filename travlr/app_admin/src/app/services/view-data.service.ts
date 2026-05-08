import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TripView } from '../models/trip-view';

@Injectable({
  providedIn: 'root'
})
export class ViewDataService {
  private apiBaseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getViews(): Observable<TripView[]> {
    return this.http.get<TripView[]>(`${this.apiBaseUrl}/views`);
  }
}