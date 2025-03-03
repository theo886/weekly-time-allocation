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
  try {
    // Call the Azure Function API
    const response = await fetch('/api/getTimesheets');
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    
    // In development, fall back to mock data
    if (isDevelopment()) {
      console.log("Falling back to mock data");
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
  try {
    const response = await fetch('/api/saveTimesheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timesheet),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error saving timesheet:", error);
    
    // In development, simulate a successful save
    if (isDevelopment()) {
      if (!timesheet.id) {
        return { ...timesheet, id: `mock-timesheet-${Date.now()}` };
      }
      return timesheet;
    }
    
    return { error: error.message };
  }
};

export default {
  getTimesheets,
  getTimesheetById,
  saveTimesheet
}; 