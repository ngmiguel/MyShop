import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.toParams(params) });
  }

  post<T>(path: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body ?? {}, { params: this.toParams(params) });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body ?? {});
  }

  delete<T>(path: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, {
      body,
      params: this.toParams(params),
    });
  }

  private toParams(params?: Record<string, string | number | boolean | undefined>): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
