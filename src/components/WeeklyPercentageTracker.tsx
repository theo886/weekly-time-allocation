import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Project, TimeEntry, TimeSheet } from '../models/types';

const WeeklyPercentageTracker: React.FC = () => {
  // Sample projects data
  const projects: Project[] = [
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
  const [currentWeek, setCurrentWeek] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // State for project time entries
  const [entries, setEntries] = useState<TimeEntry[]>([
    { id: Date.now(), projectId: "", percentage: "100", isManuallySet: false }
  ]);

  // State to track manually edited entries
  const [manuallyEditedIds, setManuallyEditedIds] = useState<Set<number>>(new Set());

  // State to track if any dropdown is open
  const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState<boolean>(false);
  
  // State to track if current allocation is pinned
  const [isPinned, setIsPinned] = useState<boolean>(false);

  // State for error
  const [error, setError] = useState<string>("");

  // State to store previous week's entries
  const [previousSubmissions, setPreviousSubmissions] = useState<Record<string, TimeEntry[]>>({});
  
  // State to track if current week is submitted
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  // State to track if submitted data has been modified
  const [isModified, setIsModified] = useState<boolean>(false);

  // Format date range for the week
  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const formatDate = (date: Date): string => {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Navigate to previous week
  const goToPreviousWeek = (): void => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
    
    // If pinned, keep the current entries
    if (isPinned) {
      // Just clone the current entries with new IDs
      setEntries(entries.map(entry => ({
        ...entry,
        id: Date.now() + Math.random() // Generate new IDs
      })));
      setIsSubmitted(false);
      setIsModified(false);
    } else {
      // Check if we have stored entries for the previous week
      const prevWeekKey = formatWeekRange(prevWeek);
      const previousWeekEntries = previousSubmissions[prevWeekKey];
      
      // Check if the previous week was submitted
      setIsSubmitted(!!previousWeekEntries);
      setIsModified(false);
      
      // If we have previous entries for this week, use them
      if (previousWeekEntries && previousWeekEntries.length > 0) {
        setEntries(previousWeekEntries.map(entry => ({
          ...entry,
          id: Date.now() + Math.random() // Generate new IDs
        })));
      } else {
        // Otherwise start with a blank slate
        setEntries([{ id: Date.now(), projectId: "", percentage: "100", isManuallySet: false }]);
        setManuallyEditedIds(new Set());
      }
    }
  };

  // Navigate to next week
  const goToNextWeek = (): void => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
    
    // If pinned, keep the current entries
    if (isPinned) {
      // Just clone the current entries with new IDs
      setEntries(entries.map(entry => ({
        ...entry,
        id: Date.now() + Math.random() // Generate new IDs
      })));
      setIsSubmitted(false);
      setIsModified(false);
    } else {
      // Get the next week's entries if they exist
      const nextWeekKey = formatWeekRange(nextWeek);
      const previousWeekEntries = previousSubmissions[nextWeekKey];
      
      // Check if the next week was submitted
      setIsSubmitted(!!previousWeekEntries);
      setIsModified(false);
      
      // If we have previous entries for the next week, use them
      if (previousWeekEntries && previousWeekEntries.length > 0) {
        setEntries(previousWeekEntries.map(entry => ({
          ...entry,
          id: Date.now() + Math.random() // Generate new IDs
        })));
      } else {
        // Otherwise start with a blank slate
        setEntries([{ id: Date.now(), projectId: "", percentage: "100", isManuallySet: false }]);
        setManuallyEditedIds(new Set());
      }
    }
  };

  // Add a new entry
  const addEntry = (): void => {
    // If already submitted, mark as modified
    if (isSubmitted) {
      setIsModified(true);
    }
    
    // Get all manually edited entries
    const manualEntries = entries.filter(entry => manuallyEditedIds.has(entry.id));
    
    // Calculate the sum of manually set percentages
    const manualSum = manualEntries.reduce((sum, entry) => {
      return sum + (parseInt(entry.percentage) || 0);
    }, 0);
    
    // Calculate how many entries we'll have after adding a new one
    const newCount = entries.length + 1;
    
    // Calculate how many non-manual entries we'll have (including the new one)
    const nonManualCount = newCount - manualEntries.length;
    
    // Calculate the remaining percentage to distribute
    const remainingPercentage = Math.max(0, 100 - manualSum);
    
    // Calculate equal share for non-manual entries
    const equalShare = nonManualCount > 0 ? 
      Math.floor(remainingPercentage / nonManualCount) : 0;
      
    // Create the new entry
    const newEntry: TimeEntry = { id: Date.now(), projectId: "", percentage: equalShare.toString(), isManuallySet: false };
    
    // Create updated entries list
    const updatedEntries = [
      ...entries.map(entry => {
        // Adjust percentages for non-manual entries
        if (!manuallyEditedIds.has(entry.id)) {
          return { ...entry, percentage: equalShare.toString() };
        }
        return entry;
      }),
      newEntry
    ];
    
    setEntries(updatedEntries);
  };

  // Remove an entry
  const removeEntry = (id: number): void => {
    // If already submitted, mark as modified
    if (isSubmitted) {
      setIsModified(true);
    }
    
    if (entries.length > 1) {
      // Check if the entry being removed was manually set
      const isManuallySet = manuallyEditedIds.has(id);
      
      // Remove the entry
      const filteredEntries = entries.filter(entry => entry.id !== id);
      
      // If we're removing a manually set entry, update the manual IDs set
      if (isManuallySet) {
        setManuallyEditedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
      
      // Get all manually edited entries after removal
      const manualEntries = filteredEntries.filter(entry => manuallyEditedIds.has(entry.id));
      
      // Calculate the sum of manually set percentages
      const manualSum = manualEntries.reduce((sum, entry) => {
        return sum + (parseInt(entry.percentage) || 0);
      }, 0);
      
      // Calculate how many non-manual entries we have
      const nonManualEntries = filteredEntries.filter(entry => !manuallyEditedIds.has(entry.id));
      
      // If we have non-manual entries, distribute the remaining percentage
      if (nonManualEntries.length > 0) {
        const remainingPercentage = Math.max(0, 100 - manualSum);
        const equalShare = remainingPercentage > 0 ? 
          Math.floor(remainingPercentage / nonManualEntries.length) : 0;
        
        // Distribute the remaining percentage equally
        const result = filteredEntries.map(entry => {
          if (!manuallyEditedIds.has(entry.id)) {
            return { ...entry, percentage: equalShare.toString() };
          }
          return entry;
        });
        
        setEntries(result);
      } else {
        setEntries(filteredEntries);
      }
    }
  };

  // Update an entry
  const updateEntry = (id: number, field: keyof TimeEntry, value: string): void => {
    // If already submitted, mark as modified
    if (isSubmitted) {
      setIsModified(true);
    }
    
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        // If updating percentage, mark as manually set
        if (field === 'percentage') {
          setManuallyEditedIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
          });
          return { ...entry, [field]: value, isManuallySet: true };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    });
    
    // Only redistribute if percentage was updated
    if (field === 'percentage') {
      redistributePercentages(updatedEntries, id);
    } else {
      setEntries(updatedEntries);
    }
  };

  // Redistribute percentages when an entry is manually changed
  const redistributePercentages = (updatedEntries: TimeEntry[], changedId: number): void => {
    // Get all manually set entries (including the one just changed)
    const manualEntries = updatedEntries.filter(entry => 
      entry.id === changedId || manuallyEditedIds.has(entry.id)
    );
    
    // Calculate the sum of manually set percentages
    const manualSum = manualEntries.reduce((sum, entry) => {
      return sum + (parseInt(entry.percentage) || 0);
    }, 0);
    
    // Calculate how many non-manual entries we have
    const nonManualEntries = updatedEntries.filter(entry => 
      entry.id !== changedId && !manuallyEditedIds.has(entry.id)
    );
    
    // If we have non-manual entries, distribute the remaining percentage
    if (nonManualEntries.length > 0) {
      const remainingPercentage = Math.max(0, 100 - manualSum);
      const equalShare = remainingPercentage > 0 ? 
        Math.floor(remainingPercentage / nonManualEntries.length) : 0;
      
      // Distribute the remaining percentage equally
      const result = updatedEntries.map(entry => {
        if (entry.id !== changedId && !manuallyEditedIds.has(entry.id)) {
          return { ...entry, percentage: equalShare.toString() };
        }
        return entry;
      });
      
      setEntries(result);
    } else {
      setEntries(updatedEntries);
    }
  };

  // Calculate total percentage
  const calculateTotal = (): number => {
    return entries.reduce((sum, entry) => {
      const percentage = parseInt(entry.percentage) || 0;
      return sum + percentage;
    }, 0);
  };

  // Validate entries before submission
  useEffect(() => {
    const total = calculateTotal();
    
    if (total > 100) {
      setError("Total percentage exceeds 100%");
    } else if (entries.some(entry => isDuplicateProject(entry.projectId) && entry.projectId)) {
      setError("Duplicate projects are not allowed");
    } else {
      setError("");
    }
  }, [entries]);

  // Check for duplicate projects
  const isDuplicateProject = (projectId: string): boolean => {
    return entries.filter(entry => entry.projectId === projectId).length > 1;
  };

  // Submit the timesheet
  const submitTimesheet = (): void => {
    const total = calculateTotal();
    
    if (total !== 100) {
      setError("Total percentage must equal 100%");
      return;
    }
    
    if (entries.some(entry => !entry.projectId)) {
      setError("Please select a project for all entries");
      return;
    }
    
    // Check for duplicate projects
    const projectIds = entries.map(entry => entry.projectId);
    const uniqueProjectIds = new Set(projectIds);
    
    if (uniqueProjectIds.size !== projectIds.length) {
      setError("Duplicate projects are not allowed");
      return;
    }
    
    // In a real app, you would send this data to an API
    const timesheetData: TimeSheet = {
      weekStarting: formatWeekRange(currentWeek),
      entries: entries.map(entry => ({
        projectId: entry.projectId,
        projectName: projects.find(p => p.id.toString() === entry.projectId)?.name,
        percentage: entry.percentage
      })),
      total: total
    };
    
    console.log("Submitting timesheet:", timesheetData);
    
    // Store this week's entries for future reference
    const weekKey = formatWeekRange(currentWeek);
    setPreviousSubmissions({
      ...previousSubmissions,
      [weekKey]: [...entries]
    });
    
    // Update submission state
    setIsSubmitted(true);
    setIsModified(false);
    
    // Show message based on whether this is an update or new submission
    if (isSubmitted && isModified) {
      alert("Timesheet updated successfully!");
    } else {
      alert("Timesheet submitted successfully!");
    }
  };

  // Get button text and style based on submission state
  const getButtonProps = () => {
    if (isSubmitted) {
      if (isModified) {
        return {
          text: "Update",
          className: "bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded"
        };
      } else {
        return {
          text: "Submitted",
          className: "bg-slate-400 hover:bg-slate-500 text-white px-8 py-2 rounded cursor-default"
        };
      }
    } else {
      return {
        text: "Submit",
        className: "bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded"
      };
    }
  };

  // Check if button should be disabled
  const isButtonDisabled = (): boolean => {
    return calculateTotal() !== 100 || 
           (!!error && error !== "Please select a project for all entries" && error !== "Please enter percentage for all selected projects") ||
           (isSubmitted && !isModified);
  };

  // Check if current week is already in previousSubmissions
  useEffect(() => {
    const weekKey = formatWeekRange(currentWeek);
    const isWeekSubmitted = !!previousSubmissions[weekKey];
    setIsSubmitted(isWeekSubmitted);
    setIsModified(false);
  }, [currentWeek, previousSubmissions]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-indigo-800">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                Weekly Time Allocation
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-center mb-3">
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log("Pin button clicked, current state:", isPinned);
                setIsPinned(!isPinned);
              }} 
              className={`mr-2 ${isPinned ? 'text-red-500' : 'text-slate-400'}`}
              title={isPinned ? "Unpin current allocations" : "Pin current allocations"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                viewBox="0 0 24 24"
              >
                <path d="M21 10c0 5.523-9 13-9 13S3 15.523 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </Button>
            <span className="text-lg font-semibold text-slate-800">
              Week of {formatWeekRange(currentWeek)}
            </span>
          </div>
          
          {error && error !== "Please select a project for all entries" && error !== "Please enter percentage for all selected projects" && (
            <Alert className="mb-4 bg-red-50 text-red-800 border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-8">
                  <Select 
                    value={entry.projectId} 
                    projects={projects}
                    onValueChange={(value) => updateEntry(entry.id, "projectId", value)}
                    onOpenChange={(open) => setIsAnyDropdownOpen(open)}
                  />
                </div>
                
                <div className="col-span-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="%"
                      value={entry.percentage}
                      onChange={(e) => updateEntry(entry.id, "percentage", e.target.value)}
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>
                
                <div className="col-span-1 flex justify-end">
                  {entries.length > 1 && (
                    <Button 
                      variant="ghost" 
                      onClick={() => removeEntry(entry.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add button below the last entry */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={addEntry}
                disabled={isAnyDropdownOpen}
                className="w-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 py-2 rounded-md"
              >
                <div className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </div>
              </Button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t flex justify-between items-center text-lg font-medium">
            <Button 
              variant="ghost" 
              className="text-slate-600 flex items-center" 
              onClick={goToPreviousWeek}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span>Prev</span>
            </Button>
            
            <div className="flex items-center font-medium">
              <span className="mr-2">Total:</span>
              <span className={calculateTotal() === 100 ? "text-green-600" : "text-red-600"}>
                {calculateTotal()}%
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              className="text-slate-600 flex items-center" 
              onClick={goToNextWeek}
            >
              <span>Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </div>
        </CardContent>
        
        <CardFooter>
          {/* Dynamic button text and styling */}
          <Button 
            onClick={submitTimesheet} 
            className={getButtonProps().className}
            disabled={isButtonDisabled()}
          >
            {getButtonProps().text}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WeeklyPercentageTracker; 