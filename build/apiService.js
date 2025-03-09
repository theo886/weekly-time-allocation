// apiService.js
const API_BASE_URL = '/api'; // Use relative URL to work with production and local environments

async function fetchAllTimeEntriesForUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllTimeEntries?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch time entries: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return [];
  }
}

async function saveTimeEntriesToApi(userId, weekKey, entries) {
  try {
    const response = await fetch(`${API_BASE_URL}/saveTimeEntry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        weekKey,
        entries
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save time entries: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving time entries:', error);
    throw error;
  }
}

window.apiService = {
  fetchAllTimeEntriesForUser,
  saveTimeEntriesToApi
};