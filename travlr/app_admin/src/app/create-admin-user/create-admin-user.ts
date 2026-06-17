import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TripDataService } from '../services/trip-data';

@Component({
  selector: 'app-create-admin-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-admin-user.html',
  styleUrls: ['./create-admin-user.css']
})
export class CreateAdminUserComponent {
  mode: 'create' | 'updatePassword' = 'create';

  adminUser = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  formError = '';
  successMessage = '';
  isSubmitting = false;

  constructor(private tripDataService: TripDataService) {}

  submitAdminUserForm(): void {
    if (this.mode === 'updatePassword') {
      this.updateAdminPassword();
      return;
    }

    this.createAdminUser();
  }

  setMode(mode: 'create' | 'updatePassword'): void {
    this.mode = mode;
    this.formError = '';
    this.successMessage = '';
    this.resetForm();
  }

  private createAdminUser(): void {
    this.formError = '';
    this.successMessage = '';

    if (!this.adminUser.name || !this.adminUser.email || !this.adminUser.password) {
      this.formError = 'Name, email, and password are required.';
      return;
    }

    if (this.adminUser.password !== this.adminUser.confirmPassword) {
      this.formError = 'Passwords do not match.';
      return;
    }

    if (!this.isStrongPassword(this.adminUser.password)) {
      this.formError = 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.';
      return;
    }

    this.isSubmitting = true;

    this.tripDataService.createAdminUser({
      name: this.adminUser.name.trim(),
      email: this.adminUser.email.trim(),
      password: this.adminUser.password
    }).subscribe({
      next: () => {
        this.successMessage = 'Admin user created successfully.';
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.formError = error?.error?.message || 'Unable to create admin user.';
        this.isSubmitting = false;
      }
      });
  }

  private updateAdminPassword(): void {
    this.formError = '';
    this.successMessage = '';

    if (!this.adminUser.email || !this.adminUser.password) {
      this.formError = 'Email and password are required.';
      return;
    }

    if (this.adminUser.password !== this.adminUser.confirmPassword) {
      this.formError = 'Passwords do not match.';
      return;
    }

    if (!this.isStrongPassword(this.adminUser.password)) {
      this.formError = 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.';
      return;
    }

    this.isSubmitting = true;

    this.tripDataService.updateAdminPassword({
      email: this.adminUser.email.trim(),
      password: this.adminUser.password
    }).subscribe({
      next: () => {
        this.successMessage = 'Admin password updated successfully.';
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.formError = error?.error?.message || 'Unable to update admin password.';
        this.isSubmitting = false;
      }
    });
  }

  private resetForm(): void {
    this.adminUser = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }

  private isStrongPassword(password: string): boolean {
    return (
      password.length >= 12
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password)
    );
  }
}
