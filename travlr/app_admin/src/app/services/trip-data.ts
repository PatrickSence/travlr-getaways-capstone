import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../models/trip';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { BROWSER_STORAGE } from '../storage';

// Interface used by the enhanced trip search/recommendation system.
// These fields become query parameters sent to the Express API.
export interface TripSearchParams {
  keyword?: string;
  code?: string;
  resort?: string;
  minPrice?: number;
  maxPrice?: number;
  minLength?: number;
  maxLength?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

// Response shape returned by the enhanced backend when search,
// filtering, sorting, or pagination is used.
export interface TripSearchResponse {
  count: number;
  totalMatches: number;
  page: number;
  limit: number;
  sortBy: string;
  results: Trip[];
}

export interface CreateAdminUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAdminPasswordRequest {
  email: string;
  password: string;
}

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
  //
  // Enhanced:
  // This method can still return all trips with no parameters,
  // preserving the original behavior.
  //
  // It can also send search/filter/sort parameters to the backend,
  // allowing the enhanced trips.js controller to apply algorithmic
  // filtering, weighted recommendation scoring, sorting, and pagination.
  public getTrips(params?: TripSearchParams): Observable<Trip[] | TripSearchResponse> {
    let queryParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams = queryParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Trip[] | TripSearchResponse>(this.apiBaseUrl, {
      params: queryParams
    });
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

  public createAdminUser(adminUser: CreateAdminUserRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, adminUser, {
      headers: this.getAuthHeaders()
    });
  }

  public updateAdminPassword(passwordUpdate: UpdateAdminPasswordRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin-users/password`, passwordUpdate, {
      headers: this.getAuthHeaders()
    });
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
