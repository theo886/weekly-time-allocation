import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { saveTimesheet, getTimesheets } from '../services/timesheetService';
import { useCurrentUser, getUserInfo } from '../auth/AuthProvider';

// Add PinIcon component
const PinIcon = ({ isPinned }) => {
  return isPinned ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"></line>
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0-4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
  );
};

// Format date range for the week - moved outside the component since it doesn't depend on component state
const formatWeekRange = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const formatDate = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const WeeklyPercentageTracker = () => {
  // Sample projects data
  const projects = [
    { id: 1, name: "Website Redesign", code: "WEB-001" },
    { id: 2, name: "Mobile App Development", code: "APP-002" },
    { id: 3, name: "Internal Dashboard", code: "DASH-003" },
    { id: 4, name: "Client Onboarding System", code: "CL-004" },
    { id: 5, name: "Infrastructure Upgrade", code: "INF-005" },
    { id: 6, name: "Data Migration", code: "DM-006" },
    { id: 7, name: "Security Audit", code: "SEC-007" },
    { id: 8, name: "Training & Documentation", code: "TD-008" }
  ];

  // State for the current week
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // State for project time entries
  const [entries, setEntries] = useState([
    { id: Date.now(), projectId: "", percentage: "100", isManuallySet: false, isChanged: false }
  ]);

  // Add isPinned state for the pin feature
  const [isPinned, setIsPinned] = useState(false);

  // State for input validation and loading
  const [entryErrors, setEntryErrors] = useState({});
  const [totalError, setTotalError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timesheetExists, setTimesheetExists] = useState(false);
  const [existingTimesheetId, setExistingTimesheetId] = useState(null);
  // Add a state to track loaded weeks to prevent repeated requests
  const [loadedWeeks, setLoadedWeeks] = useState({});
  
  // Use a ref to track if we're currently loading data
  const isLoadingRef = useRef(false);

  // Get user information
  const currentUser = useCurrentUser();
  const userInfo = getUserInfo(currentUser);
  
  // Store the user ID in a ref to prevent unnecessary rerenders
  const userIdRef = useRef(null);
  
  // Update the user ID ref when it changes
  useEffect(() => {
    if (userInfo && userInfo.userId) {
      // Only update if it's different to avoid unnecessary effects
      if (userIdRef.current !== userInfo.userId) {
        console.log(`User ID changed from ${userIdRef.current} to ${userInfo.userId}`);
        userIdRef.current = userInfo.userId;
      }
    }
  }, [userInfo]);

  // Calculate total percentage
  const totalPercentage = entries.reduce((total, entry) => {
    const value = parseFloat(entry.percentage) || 0;
    return total + value;
  }, 0);

  // Create a formatted week ID for database storage
  const weekId = `${currentWeek.getFullYear()}-${(currentWeek.getMonth() + 1).toString().padStart(2, '0')}-${currentWeek.getDate().toString().padStart(2, '0')}`;

  // Create a memoized function to handle loading timesheets
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleLoadTimesheets = useCallback(async () => {
    // Check if we have userInfo and a valid user ID
    if (!userInfo || !userInfo.userId) {
      console.log('[COMPONENT-DEBUG] No user info available, skipping timesheet fetch');
      console.log('[COMPONENT-DEBUG] userInfo:', userInfo);
      return;
    }
    
    // Generate a unique key for the current week and user
    const loadKey = `${weekId}_${userInfo.userId}`;
    
    // If pinned, skip data loading
    if (isPinned) {
      console.log('[COMPONENT-DEBUG] Pin mode active, using current entries');
      return;
    }
    
    // Check if we've already loaded data for this week and user
    if (loadedWeeks[loadKey]) {
      console.log('[COMPONENT-DEBUG] Already loaded data for week:', weekId, 'and user:', userInfo.userId);
      return;
    }
    
    // Debug the userInfo object fully
    console.log('[COMPONENT-DEBUG] handleLoadTimesheets with userInfo:', JSON.stringify(userInfo, null, 2));
    
    // Verify that the user ID is consistent
    if (userIdRef.current !== userInfo.userId) {
      console.warn(`[COMPONENT-DEBUG] User ID mismatch: ref has ${userIdRef.current} but userInfo has ${userInfo.userId}`);
      return;
    }
    
    // Prevent unnecessary fetches
    if (isLoadingRef.current) {
      console.log('[COMPONENT-DEBUG] Already loading, skipping duplicate fetch');
      return;
    }
    
    console.log('[COMPONENT-DEBUG] Loading timesheets for week:', weekId, 'and user:', userInfo.userId);
    
    // Update both the state and the ref
    setIsLoading(true);
    isLoadingRef.current = true;
    
    setEntryErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      console.log('[COMPONENT-DEBUG] Calling getTimesheets with userInfo:', JSON.stringify(userInfo, null, 2));
      const timesheets = await getTimesheets(userInfo);
      console.log('[COMPONENT-DEBUG] Timesheets received:', JSON.stringify(timesheets));
      
      // Mark this week and user combination as loaded
      setLoadedWeeks(prev => ({
        ...prev,
        [loadKey]: true
      }));
      
      // If the user ID changed during the fetch, discard the results
      if (userIdRef.current !== userInfo.userId) {
        console.warn('[COMPONENT-DEBUG] User ID changed during fetch, discarding results');
        return;
      }
      
      // Log all received timesheets for debugging
      console.log('All timesheets received:', timesheets.map(ts => ({ 
        id: ts.id,
        weekStarting: ts.weekStarting,
        userId: ts.userId 
      })));
      
      // Find the timesheet for the current week
      const existingTimesheet = timesheets.find(ts => ts.weekStarting === weekId);
      
      if (existingTimesheet && existingTimesheet.entries && Array.isArray(existingTimesheet.entries)) {
        console.log('Found existing timesheet for week:', weekId);
        setTimesheetExists(true);
        setExistingTimesheetId(existingTimesheet.id);
        
        // Map the entries from the existing timesheet
        const savedEntries = existingTimesheet.entries.map((entry, index) => ({
          id: index + 1,
          projectId: entry.projectId,
          percentage: entry.percentage,
          isManuallySet: true
        }));
        
        setEntries(savedEntries.length > 0 ? savedEntries : [{ 
          id: Date.now(), 
          projectId: "", 
          percentage: "100", 
          isManuallySet: false 
        }]);
      } else {
        console.log('No existing timesheet found for week:', weekId);
        // Reset to default state for a new week
        setTimesheetExists(false);
        setExistingTimesheetId(null);
        setEntries([{ id: Date.now(), projectId: "", percentage: "100", isManuallySet: false }]);
      }
    } catch (error) {
      console.error("Error loading timesheets:", error);
    } finally {
      // Update both the state and the ref
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [userInfo, weekId, loadedWeeks, isPinned]);

  // Load existing timesheet data when the week changes or user logs in
  useEffect(() => {
    // Only load timesheets if we have a valid user
    if (userInfo && userInfo.userId && userIdRef.current === userInfo.userId) {
      handleLoadTimesheets();
    } else {
      console.log('No valid user ID or ID mismatch, skipping timesheet load');
    }
  }, [currentWeek, userInfo, weekId, handleLoadTimesheets]);

  // Validate total percentage whenever entries change
  useEffect(() => {
    setTotalError(Math.round(totalPercentage) !== 100);
  }, [totalPercentage]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  // Add a new entry
  const addEntry = () => {
    const newEntry = {
      id: Date.now(),
      projectId: "",
      percentage: "0",
      isManuallySet: false
    };
    
    // Distribute percentages when adding a new entry
    const updatedEntries = [...entries, newEntry];
    
    // Check if we have any entry with percentage > 0 that we can redistribute from
    const hasEntryToRedistributeFrom = entries.some(e => 
      parseFloat(e.percentage) > 0
    );
    
    if (hasEntryToRedistributeFrom) {
      redistributePercentages(updatedEntries, newEntry.id);
    } else {
      // If all entries are 0%, just add the new entry
      setEntries(updatedEntries);
    }
  };

  // Remove an entry
  const removeEntry = (id) => {
    // Cannot remove the last entry
    if (entries.length <= 1) {
      return;
    }
    
    // Get the percentage of the entry being removed
    const removedEntry = entries.find(entry => entry.id === id);
    const removedPercentage = parseFloat(removedEntry?.percentage) || 0;
    
    // Filter out the entry to remove
    const updatedEntries = entries.filter(entry => entry.id !== id);
    
    // If the removed entry had a percentage, redistribute it
    if (removedPercentage > 0) {
      // Find entries that can receive percentage
      const availableEntries = updatedEntries.filter(e => e.id !== id);
      
      if (availableEntries.length > 0) {
        // Distribute the removed percentage evenly
        const percentageToAdd = removedPercentage / availableEntries.length;
        
        const redistributed = availableEntries.map(entry => {
          const currentPercentage = parseFloat(entry.percentage) || 0;
          const newPercentage = currentPercentage + percentageToAdd;
          
          return {
            ...entry,
            percentage: newPercentage.toString(),
            isManuallySet: false
          };
        });
        
        setEntries(redistributed);
      } else {
        // If no entries left, create a default one with 100%
        setEntries([{ 
          id: Date.now(), 
          projectId: "", 
          percentage: "100", 
          isManuallySet: false 
        }]);
      }
    } else {
      // If the removed entry had 0%, just remove it
      setEntries(updatedEntries);
    }
  };

  // Update an entry field
  const updateEntry = (id, field, value) => {
    setEntryErrors(prev => ({ ...prev, [id]: null }));
    
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        if (field === 'percentage') {
          // Validate percentage value
          if (value !== "" && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 100)) {
            setEntryErrors(prev => ({ ...prev, [id]: "Must be a number from 0-100" }));
            return entry;
          }
          
          // Mark as changed
          return { ...entry, [field]: value, isManuallySet: true, isChanged: true };
        }
        return { ...entry, [field]: value, isChanged: true };
      }
      return entry;
    });
    
    setEntries(updatedEntries);
    
    // If percentage field is changed, redistribute
    if (field === 'percentage') {
      redistributePercentages(updatedEntries, id);
    }
  };

  // Redistribute percentages when one entry changes
  const redistributePercentages = (updatedEntries, changedId) => {
    // Get the changed entry
    const changedEntry = updatedEntries.find(e => e.id === changedId);
    if (!changedEntry) return;
    
    // Calculate total for all entries except manually set ones
    let totalManualPercentage = 0;
    
    updatedEntries.forEach(entry => {
      if (entry.isManuallySet || entry.id === changedId) {
        totalManualPercentage += parseFloat(entry.percentage) || 0;
      }
    });
    
    // Count entries that can be auto-adjusted
    const autoAdjustEntries = updatedEntries.filter(
      entry => !entry.isManuallySet && entry.id !== changedId
    );
    
    // Calculate how much percentage points we need to distribute
    const remainingPercentage = 100 - totalManualPercentage;
    
    // If nothing to redistribute or no entries to redistribute to, just update
    if (autoAdjustEntries.length === 0 || remainingPercentage <= 0) {
      setEntries(updatedEntries);
      return;
    }
    
    // Distribute remaining percentage evenly
    const percentagePerEntry = remainingPercentage / autoAdjustEntries.length;
    
    // Update the auto-adjust entries
    const finalEntries = updatedEntries.map(entry => {
      if (!entry.isManuallySet && entry.id !== changedId) {
        return {
          ...entry,
          percentage: percentagePerEntry.toFixed(1)
        };
      }
      return entry;
    });
    
    setEntries(finalEntries);
  };

  // Submit the timesheet
  const submitTimesheet = async () => {
    if (!userInfo) {
      setSaveError("You must be signed in to save your timesheet");
      return;
    }
    
    // Validate entries
    let hasErrors = false;
    const errors = {};
    
    entries.forEach(entry => {
      if (!entry.projectId) {
        errors[entry.id] = "Please select a project";
        hasErrors = true;
      }
      
      const percentage = parseFloat(entry.percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors[entry.id] = "Percentage must be between 0-100";
        hasErrors = true;
      }
    });
    
    // Validate total percentage
    if (Math.round(totalPercentage) !== 100) {
      setTotalError(true);
      hasErrors = true;
    } else {
      setTotalError(false);
    }
    
    if (hasErrors) {
      setEntryErrors(errors);
      return;
    }
    
    // Prepare the timesheet data
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const timesheet = {
        id: existingTimesheetId || `${userInfo.userId}-${weekId}`,
        weekStarting: weekId,
        entries: entries.map(entry => ({
          projectId: entry.projectId,
          projectName: projects.find(p => p.id.toString() === entry.projectId)?.name || "",
          percentage: entry.percentage
        })),
        total: totalPercentage
      };
      
      const result = await saveTimesheet(timesheet, userInfo);
      
      if (result.id) {
        setSaveSuccess(true);
        setExistingTimesheetId(result.id);
        setTimesheetExists(true);
        
        // After successful save, reset the loaded state for this week to allow refreshing data
        const loadKey = `${weekId}_${userInfo.userId}`;
        setLoadedWeeks(prev => ({...prev, [loadKey]: false}));
        
        // Mark all entries as not changed
        setEntries(entries.map(entry => ({
          ...entry,
          isChanged: false
        })));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error saving timesheet:", error);
      setSaveError(error.message || "Failed to save timesheet");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if the save button should be disabled
  const isButtonDisabled = () => {
    // Disabled if any entry has errors
    if (Object.keys(entryErrors).length > 0) return true;
    
    // Disabled if total percentage isn't 100%
    if (Math.round(totalPercentage) !== 100) return true;
    
    // Disabled if any entry doesn't have a project selected
    if (entries.some(entry => !entry.projectId)) return true;
    
    // Disabled if there are duplicate project selections
    const projectIds = entries.map(entry => entry.projectId).filter(id => id);
    if (new Set(projectIds).size !== projectIds.length) return true;
    
    // Disabled if no user is logged in
    if (!userInfo) return true;
    
    // If this is an existing timesheet and nothing has changed, disable the button
    if (timesheetExists && !entries.some(entry => entry.isChanged)) return true;
    
    return false;
  };
  
  // Modified resetAndGoToPreviousWeek to handle pinned state
  const resetAndGoToPreviousWeek = () => {
    // Get the current entries before changing the week
    const currentEntries = [...entries];
    
    // Change the week
    goToPreviousWeek();
    
    // Reset loaded state for the new week
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    const newWeekId = `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${newDate.getDate().toString().padStart(2, '0')}`;
    
    if (userInfo && userInfo.userId) {
      const loadKey = `${newWeekId}_${userInfo.userId}`;
      setLoadedWeeks(prev => ({...prev, [loadKey]: isPinned}));
      
      // If pinned, don't fetch data but use current entries
      if (isPinned) {
        setEntries(currentEntries.map(entry => ({
          ...entry,
          id: Date.now() + Math.random(), // Generate new IDs
          isChanged: true
        })));
        setTimesheetExists(false);
        setExistingTimesheetId(null);
      }
    }
  };

  // Modified resetAndGoToNextWeek to handle pinned state
  const resetAndGoToNextWeek = () => {
    // Get the current entries before changing the week
    const currentEntries = [...entries];
    
    // Change the week
    goToNextWeek();
    
    // Reset loaded state for the new week
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    const newWeekId = `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${newDate.getDate().toString().padStart(2, '0')}`;
    
    if (userInfo && userInfo.userId) {
      const loadKey = `${newWeekId}_${userInfo.userId}`;
      setLoadedWeeks(prev => ({...prev, [loadKey]: isPinned}));
      
      // If pinned, don't fetch data but use current entries
      if (isPinned) {
        setEntries(currentEntries.map(entry => ({
          ...entry,
          id: Date.now() + Math.random(), // Generate new IDs
          isChanged: true
        })));
        setTimesheetExists(false);
        setExistingTimesheetId(null);
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-600">Loading timesheet data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-indigo-800">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Weekly Time Allocation
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-center mb-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsPinned(!isPinned)} 
              className={`mr-2 ${isPinned ? 'text-amber-600' : 'text-slate-400'}`}
            >
              <PinIcon isPinned={isPinned} />
            </Button>
            <span className="text-lg font-semibold text-slate-800">
              Week of {formatWeekRange(currentWeek)}
            </span>
          </div>
          
          {/* Success message */}
          {saveSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Timesheet saved successfully!
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error message */}
          {saveError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {saveError}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Total percentage error */}
          {totalError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                Total percentage must equal 100%
              </AlertDescription>
            </Alert>
          )}
        
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-8">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project
                  </label>
                  <Select
                    value={entry.projectId}
                    onChange={(e) => updateEntry(entry.id, 'projectId', e.target.value)}
                    className={`${entryErrors[entry.id] && !entry.projectId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option 
                        key={project.id} 
                        value={project.id.toString()}
                        disabled={entries.some(e => e.id !== entry.id && e.projectId === project.id.toString())}
                      >
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Percentage
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={entry.percentage}
                      onChange={(e) => updateEntry(entry.id, 'percentage', e.target.value)}
                      className={`pr-8 ${
                        entryErrors[entry.id] && (entry.percentage === "" || isNaN(parseFloat(entry.percentage)) || 
                        parseFloat(entry.percentage) < 0 || parseFloat(entry.percentage) > 100) 
                          ? 'border-red-500' 
                          : ''
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                      %
                    </span>
                  </div>
                </div>
                
                <div className="col-span-1 flex justify-end">
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {entryErrors[entry.id] && (
                  <p className="col-span-12 text-red-500 text-xs mt-1">
                    {entryErrors[entry.id]}
                  </p>
                )}
              </div>
            ))}
            
            {/* Add button below the last entry */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                onClick={addEntry}
              >
                <div className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </div>
              </Button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <Button 
              variant="ghost" 
              className="text-slate-600 flex items-center" 
              onClick={resetAndGoToPreviousWeek}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span>Prev</span>
            </Button>
            
            <div className="flex items-center font-medium">
              <span className="mr-2">Total:</span>
              <span className={totalError ? "text-red-600" : "text-green-600"}>
                {totalPercentage}%
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              className="text-slate-600 flex items-center" 
              onClick={resetAndGoToNextWeek}
            >
              <span>Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="bg-slate-50 border-t p-4 h-20 flex justify-center items-center">
          <Button
            onClick={submitTimesheet}
            disabled={isButtonDisabled()}
            className={`px-8 py-2 rounded ${
              isButtonDisabled() ? 
              'bg-slate-400 text-white' : 
              'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              timesheetExists ? "Update Timesheet" : "Save Timesheet"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WeeklyPercentageTracker; 