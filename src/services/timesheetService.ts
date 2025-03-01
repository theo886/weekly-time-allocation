import { TimeSheet } from '../models/types';

// Base URL for API requests - automatically detects if running locally or in Azure
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:7071/api' 
  : '/api';

// Get timesheets for a user
export async function getTimesheets(userId: string): Promise<TimeSheet[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/timesheets?userId=${userId}`);
    
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

// Save a timesheet
export async function saveTimesheet(timesheet: TimeSheet): Promise<{ id: string, message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/timesheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timesheet)
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