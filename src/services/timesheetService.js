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
    console.log('[TIMESHEET-DEBUG] getTimesheets called with:', JSON.stringify(userInfo, null, 2));
    
    // Ensure userInfo is valid
    if (!userInfo || !userInfo.userId) {
      console.error('[TIMESHEET-DEBUG] Invalid userInfo passed to getTimesheets:', userInfo);
      return [];
    }
    
    // Check for the problematic hardcoded user ID
    if (userInfo.userId === 'user1_3-1-2023-3-7-2023') {
      console.warn('[TIMESHEET-DEBUG] Detected problematic hardcoded user ID. This appears to be a test ID and should not be used.');
      return []; // Return empty array for this special case
    }

    // Additional check - if the userId contains "user1", log a warning as it might be test data
    if (userInfo.userId && userInfo.userId.includes('user1')) {
      console.warn('[TIMESHEET-DEBUG] userId contains "user1", which might indicate test data:', userInfo.userId);
    }
    
    // Create a cache key for this specific user
    const cacheKey = `timesheets_${userInfo.userId}`;
    console.log('[TIMESHEET-DEBUG] Using cache key:', cacheKey);
    
    // Check for cached data to prevent excessive fetching
    sessionStorage.removeItem(cacheKey); // Explicitly clear cache before fetching
    console.log('[TIMESHEET-DEBUG] Cleared cache explicitly for key:', cacheKey);

    const headers = await getAuthHeaders();
    console.log('[TIMESHEET-DEBUG] Auth headers obtained:', headers.Authorization ? 'Authorization header present' : 'No Authorization header');
    
    // Add detailed logging about the user info
    console.log('[TIMESHEET-DEBUG] Fetching timesheets with user info:', JSON.stringify(userInfo));
    
    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Log the API URL being called
    const apiUrl = `${API_BASE_URL}/timesheets?userId=${userInfo.userId}`;
    console.log('[TIMESHEET-DEBUG] Calling API URL:', apiUrl);
    
    try {
      // Add a try-catch specifically for fetch to better handle CORS errors
      try {
        const response = await fetch(apiUrl, {
          headers,
          signal: controller.signal,
          // Add explicit mode credentials
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        console.log('[TIMESHEET-DEBUG] API response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Error fetching timesheets: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[TIMESHEET-DEBUG] Raw API response:', JSON.stringify(data));
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timesheets: data.timesheets || [],
          timestamp: Date.now()
        }));
        
        console.log('[TIMESHEET-DEBUG] Returning timesheets:', JSON.stringify(data.timesheets || []));
        return data.timesheets || [];
      } catch (corsError) {
        console.error('[TIMESHEET-DEBUG] Possible CORS or network error:', corsError);
        
        // If we get a CORS error and we're in production, try with a relative URL
        if (window.location.hostname !== 'localhost' && apiUrl.includes('https://')) {
          console.log('[TIMESHEET-DEBUG] Attempting fallback to relative URL due to CORS issue');
          const relativeUrl = `/api/timesheets?userId=${userInfo.userId}`;
          
          const relativeResponse = await fetch(relativeUrl, {
            headers,
            signal: controller.signal
          });
          
          if (!relativeResponse.ok) {
            throw new Error(`Error fetching timesheets with relative URL: ${relativeResponse.statusText}`);
          }
          
          const data = await relativeResponse.json();
          console.log('[TIMESHEET-DEBUG] Relative URL API response:', JSON.stringify(data));
          
          return data.timesheets || [];
        }
        
        throw corsError;
      }
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