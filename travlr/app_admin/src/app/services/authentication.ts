import { Inject, Injectable } from '@angular/core';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripDataService } from '../services/trip-data';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  authResp: AuthResponse = new AuthResponse();

  constructor(
    @Inject(BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripDataService
  ) {}

  // Get token from local storage
  public getToken(): string {
    const token = this.storage.getItem('travlr-token');
    return token ? token : '';
  }

  // Save token to local storage
  public saveToken(token: string): void {
    this.storage.setItem('travlr-token', token);
  }

  // Remove token on logout
  public logout(): void {
    this.storage.removeItem('travlr-token');
  }

  // Check whether token exists and is not expired
  public isLoggedIn(): boolean {
    const token = this.getToken();

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > (Date.now() / 1000);
    }

    return false;
  }

  // Get current user info from token payload
  public getCurrentUser(): User {
    const token = this.getToken();
    const { email, name } = JSON.parse(atob(token.split('.')[1]));
    return { email, name } as User;
  }

  // Login user and save JWT
  public login(user: User, passwd: string): void {
  this.tripDataService.login(user, passwd)
    .subscribe({
      next: (value: any) => {
        console.log('LOGIN response:', value);
        console.log('LOGIN token:', value?.token);

        if (value) {
          this.authResp = value;
          this.saveToken(this.authResp.token);
          console.log('Token saved to storage:', this.getToken());
        }
      },
      error: (error: any) => {
        console.log('Login error:', error);
      }
    });
}

  // Register user and save JWT
  public register(user: User, passwd: string): void {
  this.tripDataService.register(user, passwd)
    .subscribe({
      next: (value: any) => {
        console.log('REGISTER response:', value);
        console.log('REGISTER token:', value?.token);

        if (value) {
          this.authResp = value;
          this.saveToken(this.authResp.token);
          console.log('Token saved to storage:', this.getToken());
        }
      },
      error: (error: any) => {
        console.log('Register error:', error);
      }
    });
}
}