import { Injectable } from '@angular/core';

const SESSION_KEY = 'myshop_session_id';

@Injectable({ providedIn: 'root' })
export class SessionService {
  getSessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  resetSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }
}
