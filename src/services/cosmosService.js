// Frontend service that communicates with the backend API
// We'll use mock data for development when the API is not available

// In-memory mock data for development
const mockData = [
  {
    id: "mock-timesheet-1",
    name: "Sample Timesheet 1",
    numberValue: 42,
    week: "2023-W01",
    projects: [
      { name: "Project A", percentage: 30 },
      { name: "Project B", percentage: 70 }
    ]
  },
  {
    id: "mock-timesheet-2",
    name: "Sample Timesheet 2",
    numberValue: 100,
    week: "2023-W02",
    projects: [
      { name: "Project C", percentage: 50 },
      { name: "Project D", percentage: 50 }
    ]
  }
];

// Helper function to determine if we're in a development environment
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Get all timesheets
export const getTimesheets = async () => {
  console.log('🔍 getTimesheets: Attempting to fetch timesheets from API...');
  
  try {
    // Call the Azure Function API
    console.log('🔍 getTimesheets: Calling API endpoint: /api/getTimesheets');
    const response = await fetch('/api/getTimesheets');
    
    console.log(`🔍 getTimesheets: Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`🔍 getTimesheets: Successfully retrieved data. Items count: ${Array.isArray(data) ? data.length : 'not an array'}`);
    console.log('🔍 getTimesheets: First item sample:', data.length > 0 ? JSON.stringify(data[0]).substring(0, 100) + '...' : 'No data');
    
    return data;
  } catch (error) {
    console.error("❌ Error fetching timesheets:", error);
    
    // In development, fall back to mock data
    if (isDevelopment()) {
      console.log("🔍 getTimesheets: Falling back to mock data in development mode");
      return mockData;
    }
    
    return { error: error.message };
  }
};

// Get a specific timesheet by id
export const getTimesheetById = async (id) => {
  try {
    const response = await fetch(`/api/getTimesheet/${id}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching timesheet with id ${id}:`, error);
    
    // In development, fall back to mock data
    if (isDevelopment()) {
      return mockData.find(item => item.id === id) || null;
    }
    
    return { error: error.message };
  }
};

// Save a timesheet
export const saveTimesheet = async (timesheet) => {
  console.log('🔍 saveTimesheet: Attempting to save timesheet to API...', timesheet);
  
  try {
    const response = await fetch('/api/saveTimesheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timesheet),
    });
    
    console.log(`🔍 saveTimesheet: Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get detailed error information from the response
      let errorDetail = '';
      try {
        const errorResponse = await response.json();
        console.error('🔍 saveTimesheet: Detailed error from API:', errorResponse);
        errorDetail = errorResponse.error || 
                     errorResponse.details || 
                     errorResponse.message || 
                     '';
        
        // Throw error with details
        throw new Error(`Server responded with ${response.status}: ${errorDetail}`);
      } catch (jsonError) {
        // If we can't parse the JSON, just use the status text
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('🔍 saveTimesheet: Successfully saved timesheet:', data);
    return data;
  } catch (error) {
    console.error("❌ Error saving timesheet:", error);
    
    // In development, simulate a successful save
    if (isDevelopment()) {
      console.log("🔍 saveTimesheet: Falling back to mock save in development mode");
      if (!timesheet.id) {
        return { ...timesheet, id: `mock-timesheet-${Date.now()}` };
      }
      return timesheet;
    }
    
    return { error: error.message };
  }
};

// Test API connectivity
export const pingApi = async () => {
  console.log('🔍 pingApi: Testing API connectivity...');
  
  try {
    const response = await fetch('/api/ping');
    console.log(`🔍 pingApi: Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`API ping failed with status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🔍 pingApi: API responded successfully:', data);
    return data;
  } catch (error) {
    console.error("❌ Error pinging API:", error);
    return { error: error.message };
  }
};

export default {
  getTimesheets,
  getTimesheetById,
  saveTimesheet,
  pingApi
}; 