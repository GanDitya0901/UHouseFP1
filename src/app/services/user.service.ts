  import { Injectable, EventEmitter } from '@angular/core';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { Observable, throwError } from 'rxjs';
  import { catchError } from 'rxjs/operators';

  @Injectable({
    providedIn: 'root'
  })
  export class UserService {
    private apiUrl = 'http://localhost:3000';
    private tokenKey = 'jwtToken';
    private username: string | null = null;

    tokenEmitter: EventEmitter<string> = new EventEmitter<string>();

    constructor(private http: HttpClient) {}
    setUsername(username: string): void {
      this.username = username;
    }
  
    getUsername(): string | null {
      return this.username;
    }

    getToken(): string | null {
      return localStorage.getItem(this.tokenKey);
    }
    
    setToken(token: string): void {
      localStorage.setItem(this.tokenKey, token);
    }
    
    forgotPassword(email: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
        catchError(error => throwError(error))
      );
    }
  
    resetPassword(token: string, newPassword: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/reset-password/${token}`, { password: newPassword }).pipe(
        catchError(error => throwError(error))
      );
    }

    // Method to login and emit token
    login(email: string, password: string): void {
      this.http.post<any>(`${this.apiUrl}/login`, { email, password }).subscribe(
        response => {
          console.log('Login successful');
          const token = response.token;
          this.setToken(token);
          this.tokenEmitter.emit(token);
        },
        error => {
          console.error('Error logging in', error);
        }
      );
    }

    emitToken(token: string) {
      this.tokenEmitter.emit(token);
    }
     
   
    logout(): void {
      localStorage.removeItem(this.tokenKey);
      this.tokenEmitter.emit('');
    }



    getUserProfile(): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      return this.http.get(`${this.apiUrl}/user/profile`, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    updateUserProfile(user: any): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      return this.http.put(`${this.apiUrl}/user/profile`, user, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    changeUserPassword(currentPassword: string, newPassword: string): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      const body = { currentPassword, newPassword };
    
      return this.http.post(`${this.apiUrl}/user/change-password`, body, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }
    
    uploadFile(file: File, roomData: any): Observable<any> {
      console.log('dataservicemasuk', roomData)
      const formData = new FormData();
      formData.append('roomImg', file, file.name);
      formData.append('roomType', roomData.roomType);
      formData.append('roomNum', roomData.roomNum);
      formData.append('roomPrice', roomData.roomPrice);
      formData.append('roomDesc', roomData.roomDesc);
      formData.append('roomBathroom', roomData.roomBathroom);
      formData.append('roomFloor', roomData.roomFloor);
      formData.append('bedType', roomData.bedType);
      formData.append('numBeds', roomData.numBeds);
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
    
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
      return this.http.post<any>(`${this.apiUrl}/roommanages`, formData, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }
    
    getRooms(): Observable<any[]> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
      return this.http.get<any[]>(`${this.apiUrl}/roommanages`, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }
    updateRoom(roomId: string, roomData: FormData): Observable<any> {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
      });
    
      return this.http.put<any>(`${this.apiUrl}/roommanages/${roomId}`, roomData, { headers });
    }
    

    deleteRoom(roomId: string): Observable<any> {
      return this.http.delete(`${this.apiUrl}/roommanages/${roomId}`, this.getHttpOptions()).pipe(
        catchError(this.handleError)
      );
    }
  
    private getHttpOptions() {
      const token = localStorage.getItem(this.tokenKey);
      return {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      };
    }
  
    private handleError(error: any) {
      console.error('An error occurred', error);
      return throwError(error);
    }
  
  
    
   
  }
