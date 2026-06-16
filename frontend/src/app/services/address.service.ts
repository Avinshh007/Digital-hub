// src/app/services/address.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/addresses`;

  async getAddresses(): Promise<{ addresses: Address[] }> {
    return firstValueFrom(
      this.http.get<{ addresses: Address[] }>(this.apiUrl, { withCredentials: true })
    );
  }

  async addAddress(addressData: Omit<Address, 'id' | 'country' | 'isDefault'> & { isDefault?: boolean }): Promise<any> {
    return firstValueFrom(
      this.http.post(this.apiUrl, addressData, { withCredentials: true })
    );
  }

  async updateAddress(id: string, addressData: Partial<Address>): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/${id}`, addressData, { withCredentials: true })
    );
  }

  async deleteAddress(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true })
    );
  }

  async setDefault(id: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/${id}/default`, {}, { withCredentials: true })
    );
  }
}
