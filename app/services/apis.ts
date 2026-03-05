import { sessionResponse } from "../types";


// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;


export const checkSession = async (): Promise<sessionResponse> => {
  try {
    const response = await fetch('/api/session-check', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Crucial to send the session cookie
    });

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('❌ Session Check Error:', error);
    return { success: false};
  }
};