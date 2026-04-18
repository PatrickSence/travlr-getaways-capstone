import { Routes } from '@angular/router';
import { TripListingComponent } from './trip-listing/trip-listing';
import { AddTripComponent } from './add-trip/add-trip';
import { EditTripComponent } from './edit-trip/edit-trip';
import { DeleteTripComponent } from './delete-trip/delete-trip';
import { LoginComponent } from './login/login';
import { BookingsComponent } from './bookings/bookings';
import { ViewsComponent } from './views/views';

export const routes: Routes = [
  { path: '', component: TripListingComponent, pathMatch: 'full' },
  { path: 'add-trip', component: AddTripComponent },
  { path: 'edit-trip', component: EditTripComponent },
  { path: 'trip/:tripCode/delete', component: DeleteTripComponent },
  { path: 'login', component: LoginComponent },
  { path: 'bookings', component: BookingsComponent },
  { path: 'views', component: ViewsComponent }
];