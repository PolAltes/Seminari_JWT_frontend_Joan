import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { getLocaleMonthNames } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = "http://localhost:9000/api/auth";
  constructor(private http: HttpClient) { }
  
  login(credentials: { email: string; password: string }): Observable<any> {
    //return this.http.post(`${this.apiUrl}/login`, credentials);
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response:any) => {
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('refresh_token', response.refresh_token);
      })
    );
  }
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  handleGoogleCallback(token: string): Observable<any> {
    localStorage.setItem('access_token', token);
    return of({ success: true, token: token });
  }

  isAuthenticated(): boolean {
    if(this.tokenExpired()){
      const refreshToken = localStorage.getItem('refresh_token');
      if(refreshToken){
        return true; // Si hi ha un token de refresc, considerem que l'usuari està autenticat
      }
      return false; // Si no hi ha token d'accés i tampoc de refresc, considerem que no està autenticat
    }
    return true; // Si hi ha un token d'accés vàlid, considerem que l'usuari està autenticat
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      return this.http.post(`${this.apiUrl}/refresh`, {refreshToken}).pipe(
        tap((response: any) => {
          localStorage.setItem('access_token', response.token);
        }),
        catchError((error => {
          this.logout();
          console.error('Error refreshing token:', error);
          localStorage.removeItem('access_token'); // Neteja token si no és vàlid
          return throwError (()=>error); // Retorna null en cas d'error
        })

      ));
    } else {
      return throwError (()=>new Error('No refresh token')); // No hay token de refresco disponible
    }
  }

  tokenExpired(): boolean {
    const token = localStorage.getItem('access_token');
    if (token) {
      try{
        const decodedToken: any = jwtDecode(token);
        const expirationDate = decodedToken.exp * 1000; // Convertir a milisegons
        return expirationDate < Date.now(); // Comprovar si ha caducat
      }catch(error){
        return true; //Si no es pot decodificar, considerem que ha caducat
      }
    }
    return true; // Si no hi ha token, considerem que ha caducat
  }

  retrieveToken(): any {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null; // Si no hi ha token, retornem null
  }
}

