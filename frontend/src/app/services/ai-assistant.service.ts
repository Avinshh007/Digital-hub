import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  products?: any[];
  timestamp: Date;
}

export interface ChatResponse {
  text: string;
  products?: any[];
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai-assistant/chat`;

  async sendMessage(message: string): Promise<ChatResponse> {
    return firstValueFrom(
      this.http.post<ChatResponse>(this.apiUrl, { message }, { withCredentials: true })
    );
  }
}
