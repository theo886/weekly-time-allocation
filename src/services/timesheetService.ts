import { TimeSheet, UserInfo } from '../models/types';
import { msalInstance } from '../auth/AuthProvider';
import { protectedResources } from '../auth/authConfig';

// Base URL for API requests
const API_BASE_URL = protectedResources.timeSheetApi.endpoint;

// Get the authentication token
const getToken = async (): Promise<string | null> => {
  try {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error('No active account! Verify a user has been signed in and setActiveAccount has been called.');
    }
    
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: protectedResources.timeSheetApi.scopes,
      account: account
    });
    
    return tokenResponse.accessToken;
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
    
    const response = await fetch(`${API_BASE_URL}/timesheets?userId=${userInfo.userId}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching timesheets: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.timesheets || [];
  } catch (error) {
    console.error('Failed to fetch timesheets:', error);
    throw error;
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