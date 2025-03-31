import { Component } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isMenuOpen = false;
  isLoggedIn = false;
  isDropdownOpen = false;
  userName: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      this.userName = this.authService.getUserName();

    });
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  logout() {
    this.authService.logout();
    this.isDropdownOpen = false;
    this.router.navigate(['/jsonFormtter']);
  }
}
