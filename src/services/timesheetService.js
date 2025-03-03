import { msalInstance } from '../auth/AuthProvider';
import { protectedResources } from '../auth/authConfig';

// Base URL for API requests
const API_BASE_URL = protectedResources.timeSheetApi.endpoint;

// Log the actual API base URL being used
console.log('[TIMESHEET-DEBUG] API_BASE_URL resolved to:', API_BASE_URL);

// Token cache to avoid excessive requests
let tokenCache = null;

// Get the authentication token
const getToken = async () => {
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
const getAuthHeaders = async () => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Get timesheets for the current user
export async function getTimesheets(userInfo) {
  try {
    // Ensure userInfo is valid
    if (!userInfo || !userInfo.userId) {
      console.error('[TIMESHEET-DEBUG] Invalid userInfo passed to getTimesheets:', userInfo);
      return [];
    }
    
    // Clear the cache for this user to ensure fresh data
    const cacheKey = `timesheets_${userInfo.userId}`;
    sessionStorage.removeItem(cacheKey);
    console.log('[TIMESHEET-DEBUG] Cleared cache explicitly for key:', cacheKey);
    
    const headers = await getAuthHeaders();
    console.log('[TIMESHEET-DEBUG] Auth headers obtained:', headers.Authorization ? 'Authorization header present' : 'No Authorization header');
    
    // Add detailed logging about the user info
    console.log('[TIMESHEET-DEBUG] Fetching timesheets with user info:', JSON.stringify(userInfo, null, 2));
    
    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Log the API URL being called
    const apiUrl = `/api/timesheets?userId=${userInfo.userId}`;
    console.log('[TIMESHEET-DEBUG] Calling API URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        headers,
        signal: controller.signal,
        credentials: 'same-origin'
      });
      
      clearTimeout(timeoutId);
      console.log('[TIMESHEET-DEBUG] API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TIMESHEET-DEBUG] API error response:', errorText);
        throw new Error(`Error fetching timesheets: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[TIMESHEET-DEBUG] Raw API response:', JSON.stringify(data));
      
      // Make sure we have a valid response structure
      if (!data || !data.timesheets) {
        console.warn('[TIMESHEET-DEBUG] Unexpected API response format. Expected { timesheets: [] }');
        return [];
      }
      
      console.log('[TIMESHEET-DEBUG] Returning timesheets:', JSON.stringify(data.timesheets));
      return data.timesheets || [];
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.warn('[TIMESHEET-DEBUG] Fetch request timed out after 10 seconds');
        return []; // Return empty array on timeout
      }
      
      console.error('[TIMESHEET-DEBUG] Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('[TIMESHEET-DEBUG] Failed to fetch timesheets:', error);
    // Return empty array instead of throwing to prevent cascade of errors
    return [];
  }
}

// Save a timesheet with user information
export async function saveTimesheet(timesheet, userInfo) {
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