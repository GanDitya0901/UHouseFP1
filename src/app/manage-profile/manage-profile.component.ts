import { Component, ViewChild, ElementRef, 
  AfterViewInit, ChangeDetectorRef, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-manage-profile',
  templateUrl: './manage-profile.component.html',
  styleUrls: ['./manage-profile.component.css']
})
export class ManageProfileComponent implements OnInit {

  successMessage: string = '';
  samePassMessage: string = '';
  errorMessage: string = '';

  user: any = {
    fullname: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    language: '',
    profilePhoto: '',
    address: '',
  };
  error: string = '';
  token: string | null = localStorage.getItem('jwtToken');
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  selectedFile: File | null = null; 
  temporaryPhotoUrl: string | null = null;
  editing = false;


  constructor(private userService: UserService, 
    private router: Router, 
    private http: HttpClient) { }

  ngOnInit(): void {
    if (!this.token) {
      console.log('No token found, redirecting to login.');
      this.router.navigate(['/login']);
    } else {
      console.log('Token found:', this.token);
      this.getUserProfile();
    }
  }

  fetchUserProfile() {
    this.userService.getUserProfile().subscribe(
      data => {
        this.user = data;
      },
      error => {
        console.error('Error fetching user profile:', error);
        this.error = 'Failed to fetch user profile. Please try again.';
      }
    );
  }

  getUserProfile(): void {
    this.userService.getUserProfile().subscribe(
      data => {
        console.log('Fetched user data:', data);
        this.user = data;
      },
      error => {
        console.error('Error fetching user profile:', error);
        if (error.status === 401) {
          console.log('Token invalid or expired, redirecting to login.');
          this.router.navigate(['/login']);
        }
      }
    );
  }

  saveChanges(): void {
  const formData = new FormData();

  if (this.user.fullname) formData.append('fullname', this.user.fullname);
  if (this.user.username) formData.append('username', this.user.username);
  if (this.user.email) formData.append('email', this.user.email);
  if (this.user.address) formData.append('address', this.user.address);
  if (this.user.phone) formData.append('phone', this.user.phone);
  if (this.user.dateOfBirth) formData.append('dateOfBirth', this.user.dateOfBirth);
  if (this.user.gender) formData.append('gender', this.user.gender);
  if (this.user.country) formData.append('country', this.user.country);
  if (this.user.language) formData.append('language', this.user.language);

  console.log('address:', this.user.address);
  console.log('profilephoto:', this.user.profilePhoto);

  if (this.selectedFile) {
    formData.append('profilePhoto', this.selectedFile, this.selectedFile.name);
  }

  this.userService.updateUserProfile(formData).subscribe(
    response => {
      console.log('Profile updated successfully:', response);
      // Update the user object with the new profile photo path
      if (response.profilePhoto) {
        this.user.profilePhoto = response.profilePhoto;
      }
    },
    error => {
      console.error('Error updating profile:', error);
    }
  );
}

  
  


  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.temporaryPhotoUrl = URL.createObjectURL(file);
      console.log('Selected photo file:', this.temporaryPhotoUrl);
    }
  }
  
  
  triggerFileInput(): void {
    document.getElementById('fileInput')!.click();
  }
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      this.uploadPhoto(this.selectedFile);
      console.log('selectedImg: ', this.selectedFile);
    }
  }

  uploadPhoto(file: File): void {
    const formData = new FormData();
    formData.append('profilePhoto', file);
    formData.append('userId', this.user.id);
  
    this.http.post('http://localhost:3000/uploads', formData).subscribe(
      (response: any) => {
        this.user.profilePhoto = response.filename; // Ensure the response contains 'filename'
      },
      error => {
        console.error('Error uploading photo', error);
      }
    );
  }
  

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      console.error('New password and confirm password do not match');
      this.samePassMessage = 'New password and confirm password do not match';
      setTimeout(() => {
        this.samePassMessage = '';
      }, 3000); 
    }
    else {
      this.userService.changeUserPassword(this.currentPassword, this.newPassword).subscribe(
        response => {
          console.log('Password changed successfully:', response);
          this.successMessage = "Password changed successfully"
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error => {
          console.error('Error changing password:', error);
          this.errorMessage = 'Error changing password'; 
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      );
    }
  }
  getFullImagePath(imagePath: string): string {
    return `http://localhost:3000/${imagePath}`;
}


  logout() {
    this.userService.logout();
    this.router.navigate(['/landing-page']);
  }

  viewRoom(room: any) {
    localStorage.setItem('roomDetails', JSON.stringify(room));
    this.router.navigate(['/room-details']);
  }
  
}
