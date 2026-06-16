import axios from 'axios';
import { setAccessToken } from './api';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Calls the refresh endpoint (httpOnly cookie is sent automatically).
 * Stores the new access token in memory and returns it.
 * Throws if the refresh fails (session expired / no cookie).
 */
export async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{ accessToken: string }>(
    `${BASE_URL}/api/v1/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = response.data.accessToken;
  setAccessToken(token);
  return token;
}
