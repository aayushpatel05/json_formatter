import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  
})
export class LoginComponent {
 
  loginForm!: FormGroup;
  showPassword: boolean = false;
  loginError: string | null = null;

  // constructor
  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    ;
  }

  ngOnInit(): void {
    this.initLoginForm();
  }


  private initLoginForm() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    this.loginError = null;
    if (this.loginForm.invalid) {
      console.log("Form is invalid!");
      return;
    }

    try {
      const validUser = await this.authService.loginValidation(this.loginForm.value);
      if (validUser) {
        this.router.navigate(['/jsonFormtter']);
        //this.router.navigateByUrl('/JSON', { replaceUrl: true });

      } else {
        this.loginError = 'Invalid username or password';
        console.error('Invalid credentials');
      }
    } catch (error) {
      this.loginError = 'Login failed. Please try again later.';
      console.error("Login error:", error);
    }
  }
  get userName() {
    return this.loginForm.get('userName');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
