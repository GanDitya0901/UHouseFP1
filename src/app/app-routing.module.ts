import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingPageComponent } from './landing-page/landing-page.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ManageProfileComponent } from './manage-profile/manage-profile.component';
import { TestComponent } from './test/test.component';
import { CrudRoomComponent } from './crud-room/crud-room.component';
import { RoomDetailsComponent } from './room-details/room-details.component';
import { FasiitiesAdminServiceComponent } from './fasiities-admin-service/fasiities-admin-service.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardGuestComponent } from './dashboard-guest/dashboard-guest.component';

const routes: Routes = [
  { path: 'reset-password/:token', component: SignInComponent }, 
  { path: '', redirectTo: '/landing-page', pathMatch: 'full' }, 
  { path: 'landing-page', component: LandingPageComponent},
  { path: 'signIn', component:SignInComponent},
  { path: 'signUp', component:SignUpComponent},
  { path: 'manage-profile', component: ManageProfileComponent},
  { path: 'test', component: TestComponent},
  { path: 'crudRoom', component: CrudRoomComponent}, 
  {path: 'room-details', component: RoomDetailsComponent},
  { path: 'fasilitiesAndService', component:FasiitiesAdminServiceComponent},
  {path: 'dashboard', component:DashboardComponent},
  {path: 'dashboardGuest', component:DashboardGuestComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
