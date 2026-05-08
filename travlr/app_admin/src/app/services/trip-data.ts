import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../models/trip';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { BROWSER_STORAGE } from '../storage';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private apiBaseUrl = 'http://localhost:3000/api/trips';
  baseUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage
  ) {}

  // Existing trip methods
  public getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiBaseUrl);
  }

  public getTrip(tripCode: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiBaseUrl}/${tripCode}`);
  }

  public addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiBaseUrl, formData, {
      headers: this.getAuthHeaders()
    });
  }

  public updateTrip(formData: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiBaseUrl}/${formData.code}`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  public deleteTrip(tripCode: string): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/${tripCode}`, {
      headers: this.getAuthHeaders()
    });
  }

  public getBookings(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/bookings`, {
    headers: this.getAuthHeaders()
  });
}

public getViews(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/views`, {
    headers: this.getAuthHeaders()
  });
}

  // Login endpoint
  public login(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('login', user, passwd);
  }

  // Register endpoint
  public register(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('register', user, passwd);
  }

  // Shared helper for login/register
  private handleAuthAPICall(endpoint: string, user: User, passwd: string): Observable<AuthResponse> {
    const formData = {
      name: user.name,
      email: user.email,
      password: passwd
    };

    return this.http.post<AuthResponse>(`${this.baseUrl}/${endpoint}`, formData);
  }

  // Helper to attach JWT for protected endpoints
  private getAuthHeaders(): HttpHeaders {
    const token = this.storage.getItem('travlr-token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}