// src/app/Services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userName = new BehaviorSubject<string>('');
 
  //observable
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }
 
  private initializeAuthState() {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      this.isLoggedInSubject.next(true);
      const user = JSON.parse(storedUser);
      this.userName.next(`${user.firstName} ${user.lastName}`);
    }
  }
 
 
  async authenticateUser() {
 
    try {
 
      const users = await firstValueFrom(this.http.get<any[]>('https://localhost:7229/User/GetAllUsers'));
      return users;
    } catch (e) {
      console.error('Error fetching users:', e);
      return [];
    }
 
 
  }
  async loginValidation(formValue: any) {
    console.log(formValue.userName);
    console.log(formValue.password);
 
 
    try {
      const users = await this.authenticateUser();
      console.log(users);
 
      const validUser = users.find(user =>
        user.userName === formValue.userName &&
        user.password === formValue.password
      );
      console.log(validUser);
 
 
      if (validUser) {
        const userName = (validUser.firstName + ' ' + validUser.lastName)
        console.log(userName);
 
        this.isLoggedInSubject.next(true);
        this.userName.next(userName);
 
        // Store user information in localStorage and sessionStorage
        localStorage.setItem('user', JSON.stringify(validUser));
        sessionStorage.setItem("user", JSON.stringify(validUser))
        return true;
      }
      return false;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }
 
  getUserName(): string {
    return this.userName.value
  }
 
  logout() {
    this.isLoggedInSubject.next(false);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user')
    this.router.navigate(['/jsonFormtter']);
    console.log("logout Sucsessfull")
  }
 
  isLoggedIn(): boolean {
    return !!this.isLoggedInSubject.getValue();
  }
}