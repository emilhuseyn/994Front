import { apiFetch } from './client';

export interface ContactPayload {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
}

export const contactApi = {
  submit(body: ContactPayload) {
    return apiFetch<null>('/api/contact', { method: 'POST', body });
  },
};
