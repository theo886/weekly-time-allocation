import { TimeSheet, UserInfo } from '../models/types';
import { msalInstance } from '../auth/AuthProvider';
import { protectedResources } from '../auth/authConfig';

// Base URL for API requests
const API_BASE_URL = protectedResources.timeSheetApi.endpoint;

// Token cache to avoid excessive requests
let tokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

// Get the authentication token
const getToken = async (): Promise<string | null> => {
  try {
    // Check if we have a valid cached token
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      console.log("Using cached token");
      return tokenCache.token;
    }

    const account = msalInstance.getActiveAccount();
    if (!account) {
      console.warn('No active account! Proceeding without authentication token.');
      return null;
    }
    
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: protectedResources.timeSheetApi.scopes,
        account: account
      });
      
      // Cache the token with expiration (subtract 5 minutes for safety)
      const expiresInMs = tokenResponse.expiresOn ? 
        (tokenResponse.expiresOn.getTime() - Date.now() - 5 * 60 * 1000) : 
        (3600 * 1000); // Default to 1 hour if no expiration

      tokenCache = {
        token: tokenResponse.accessToken,
        expiresAt: Date.now() + expiresInMs
      };
      
      return tokenResponse.accessToken;
    } catch (tokenError) {
      console.warn('Failed to get token, proceeding with unauthenticated request:', tokenError);
      return null;
    }
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

// Get authenticated headers
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Get timesheets for the current user
export async function getTimesheets(userInfo: UserInfo): Promise<TimeSheet[]> {
  try {
    const headers = await getAuthHeaders();
    
    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/timesheets?userId=${userInfo.userId}`, {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error fetching timesheets: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.timesheets || [];
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.warn('Fetch request timed out after 10 seconds');
        return []; // Return empty array on timeout
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to fetch timesheets:', error);
    // Return empty array instead of throwing to prevent cascade of errors
    return [];
  }
}

// Save a timesheet with user information
export async function saveTimesheet(timesheet: TimeSheet, userInfo: UserInfo): Promise<{ id: string, message: string }> {
  try {
    const headers = await getAuthHeaders();
    
    // Ensure user information is included in the timesheet
    const timesheetWithUser = {
      ...timesheet,
      userId: userInfo.userId,
      userEmail: userInfo.email,
      userName: userInfo.name,
      updatedAt: new Date().toISOString()
    };
    
    const response = await fetch(`${API_BASE_URL}/timesheets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(timesheetWithUser)
    });
    
    if (!response.ok) {
      throw new Error(`Error saving timesheet: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save timesheet:', error);
    throw error;
  }
} 