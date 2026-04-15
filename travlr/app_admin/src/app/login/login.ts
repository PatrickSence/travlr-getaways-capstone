import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  public formError: string = '';

  credentials = {
    name: '',
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {}

  public onLoginSubmit(): void {
    console.log('onLoginSubmit fired');
    console.log(this.credentials);

    this.formError = '';

    if (!this.credentials.email || !this.credentials.password || !this.credentials.name) {
      this.formError = 'All fields are required, please try again';
      return;
    }

    this.doLogin();
  }

  private doLogin(): void {
    console.log('doLogin fired');

    const newUser = {
      name: this.credentials.name,
      email: this.credentials.email
    } as User;

    this.authenticationService.login(newUser, this.credentials.password);

    setTimeout(() => {
      console.log('Checking login status...');
      console.log('Token:', this.authenticationService.getToken());

      if (this.authenticationService.isLoggedIn()) {
        this.router.navigate(['/']);
      } else {
        this.formError = 'Login failed. Please try again.';
      }
    }, 1000);
  }
}