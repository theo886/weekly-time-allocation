import { msalInstance } from '../auth/AuthProvider';
import { protectedResources } from '../auth/authConfig';

// Base URL for API requests
const API_BASE_URL = protectedResources.timeSheetApi.endpoint;

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
      console.error('Invalid userInfo passed to getTimesheets:', userInfo);
      return [];
    }
    
    // Check for the problematic hardcoded user ID
    if (userInfo.userId === 'user1_3-1-2023-3-7-2023') {
      console.warn('Detected problematic hardcoded user ID. This appears to be a test ID and should not be used.');
      return []; // Return empty array for this special case
    }
    
    // Create a cache key for this specific user
    const cacheKey = `timesheets_${userInfo.userId}`;
    
    // Check for cached data to prevent excessive fetching
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { timesheets, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        
        // If cache is less than 30 seconds old, use it
        if (cacheAge < 30000) {
          console.log(`Using cached timesheets for user ${userInfo.userId}, cache age: ${cacheAge}ms`);
          return timesheets;
        }
      } catch (e) {
        console.warn('Error parsing cached timesheet data:', e);
        sessionStorage.removeItem(cacheKey);
      }
    }
    
    const headers = await getAuthHeaders();
    
    // Add detailed logging about the user info
    console.log('Fetching timesheets with user info:', JSON.stringify(userInfo));
    
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
      console.log('Received timesheets response:', JSON.stringify(data));
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timesheets: data.timesheets || [],
        timestamp: Date.now()
      }));
      
      return data.timesheets || [];
    } catch (fetchError) {
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