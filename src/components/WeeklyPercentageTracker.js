import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, AlertCircle } from 'lucide-react';

const WeeklyPercentageTracker = () => {
  // Sample projects data
  const projects = [
    { id: "CP000022", name: "General R&D Infrastructure" },
    { id: "CP000038", name: "Skid Changeover Costs" },
    { id: "CP000039", name: "Unapplied Engineering Time" },
    { id: "MS000002", name: "PH-G Series" },
    { id: "PE000005", name: "ENG MFG Support" },
    { id: "RD000026", name: "Sage Geosystems" },
    { id: "RD000027", name: "PAXTER3 - FXE V1" },
    { id: "RD000042", name: "PX-G 1300 Product Support" },
    { id: "RD000043", name: "PG Centrifolds" },
    { id: "RD000047", name: "PX Power Train II" },
    { id: "RD000048", name: "DOE - HP Heat Pump" },
    { id: "VQ000008", name: "Water Sales Support" },
    { id: "VQ000009", name: "PX, Turbo, Pump, Support" },
    { id: "VQ000010", name: "PX part reduction, PX cost reduction" },
    { id: "VQ000011", name: "HP pump improvements" },
    { id: "VQ000012", name: "ICAR/Product Improvements" },
    { id: "VQ000013", name: "PX Dual Development" },
    { id: "WI000004", name: "Aquabold Improvements" },
    { id: "WI000023", name: "Turbo 54 550 and 875" }
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
    { id: Date.now(), projectId: "", percentage: "100", isManuallySet: false }
  ]);

  // State to track manually edited entries
  const [manuallyEditedIds, setManuallyEditedIds] = useState(new Set());

  // State to track if any dropdown is open
  const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState(false);
  
  // State to track if current allocation is pinned
  const [isPinned, setIsPinned] = useState(false);

  // State for error
  const [error, setError] = useState("");

  // State to store previous week's entries
  const [previousSubmissions, setPreviousSubmissions] = useState({});
  
  // State to track if current week is submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // State to track if submitted data has been modified
  const [isModified, setIsModified] = useState(false);

  // Format date range for the week
  const formatWeekRange = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const formatDate = (date) => {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
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
  const goToNextWeek = () => {
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
  const addEntry = () => {
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
    
    // Calculate equal share for non-manual entries (floor to get whole number)
    const equalShare = nonManualCount > 0 ? 
      Math.floor(remainingPercentage / nonManualCount) : 0;
    
    // Calculate the remainder to add to the last non-manual entry
    const remainder = nonManualCount > 0 ? 
      remainingPercentage - (equalShare * nonManualCount) : 0;
      
    // Create the new entry
    const newEntry = { id: Date.now(), projectId: "", percentage: equalShare.toString(), isManuallySet: false };
    
    // Create updated entries list
    const updatedEntries = [
      ...entries.map((entry, index) => {
        // Adjust percentages for non-manual entries
        if (!manuallyEditedIds.has(entry.id)) {
          return { ...entry, percentage: equalShare.toString() };
        }
        return entry;
      }),
      newEntry
    ];
    
    // Find the last non-manual entry (which is the new entry in this case)
    // and add the remainder to it
    if (remainder > 0) {
      const lastNonManualEntry = updatedEntries[updatedEntries.length - 1];
      lastNonManualEntry.percentage = (parseInt(lastNonManualEntry.percentage) + remainder).toString();
    }
    
    setEntries(updatedEntries);
  };

  // Remove an entry
  const removeEntry = (id) => {
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
        
        // Calculate remainder
        const remainder = remainingPercentage - (equalShare * nonManualEntries.length);
        
        // Distribute the remaining percentage equally
        const result = filteredEntries.map(entry => {
          if (!manuallyEditedIds.has(entry.id)) {
            return { ...entry, percentage: equalShare.toString() };
          }
          return entry;
        });
        
        // Find the last non-manual entry and add the remainder to it
        if (remainder > 0) {
          const nonManualResults = result.filter(entry => !manuallyEditedIds.has(entry.id));
          if (nonManualResults.length > 0) {
            const lastNonManualEntry = nonManualResults[nonManualResults.length - 1];
            const updatedPercentage = parseInt(lastNonManualEntry.percentage) + remainder;
            
            // Update the percentage in the actual result array
            const entryToUpdate = result.find(entry => entry.id === lastNonManualEntry.id);
            if (entryToUpdate) {
              entryToUpdate.percentage = updatedPercentage.toString();
            }
          }
        }
        
        setEntries(result);
      } else {
        setEntries(filteredEntries);
      }
    }
  };

  // Update an entry
  const updateEntry = (id, field, value) => {
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
  const redistributePercentages = (updatedEntries, changedId) => {
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
      
      // Calculate remainder
      const remainder = remainingPercentage - (equalShare * nonManualEntries.length);
      
      // Distribute the remaining percentage equally
      const result = updatedEntries.map(entry => {
        if (entry.id !== changedId && !manuallyEditedIds.has(entry.id)) {
          return { ...entry, percentage: equalShare.toString() };
        }
        return entry;
      });
      
      // Find the last non-manual entry and add the remainder to it
      if (remainder > 0) {
        const nonManualResults = result.filter(entry => 
          entry.id !== changedId && !manuallyEditedIds.has(entry.id)
        );
        
        if (nonManualResults.length > 0) {
          const lastNonManualEntry = nonManualResults[nonManualResults.length - 1];
          const updatedPercentage = parseInt(lastNonManualEntry.percentage) + remainder;
          
          // Update the percentage in the actual result array
          const entryToUpdate = result.find(entry => entry.id === lastNonManualEntry.id);
          if (entryToUpdate) {
            entryToUpdate.percentage = updatedPercentage.toString();
          }
        }
      }
      
      setEntries(result);
    } else {
      setEntries(updatedEntries);
    }
  };

  // Calculate total percentage
  const calculateTotal = () => {
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
  const isDuplicateProject = (projectId) => {
    return entries.filter(entry => entry.projectId === projectId).length > 1;
  };

  // Submit the timesheet
  const submitTimesheet = () => {
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
    const timesheetData = {
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
  const isButtonDisabled = () => {
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
  }, [currentWeek]);

  // Our Card, Select and other UI components
  const Card = ({ children, className }) => (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className || ''}`}>
      {children}
    </div>
  );
  
  const CardHeader = ({ children, className }) => (
    <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b ${className || ''}`}>
      {children}
    </div>
  );
  
  const CardTitle = ({ children, className }) => (
    <h3 className={`text-xl font-bold ${className || ''}`}>
      {children}
    </h3>
  );
  
  const CardContent = ({ children, className }) => (
    <div className={`p-6 ${className || ''}`}>
      {children}
    </div>
  );
  
  const CardFooter = ({ children, className }) => (
    <div className={`p-4 border-t bg-slate-50 flex justify-center items-center h-20 ${className || ''}`}>
      {children}
    </div>
  );
  
  const Button = ({ children, onClick, disabled, className, variant }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
  
  const Input = ({ type, min, max, placeholder, value, onChange, className }) => (
    <input
      type={type}
      min={min}
      max={max}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-md ${className || ''}`}
    />
  );
  
  const Select = ({ value, onValueChange, onOpenChange, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
    
    const toggleOpen = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      if (onOpenChange) onOpenChange(newState);
    };
    
    const handleSelect = (val) => {
      setSelectedValue(val);
      if (onValueChange) onValueChange(val);
      setIsOpen(false);
      if (onOpenChange) onOpenChange(false);
    };
    
    return (
      <div className="relative">
        <div 
          className="flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer"
          onClick={toggleOpen}
        >
          <span className="text-gray-500">
            {value ? projects.find(p => p.id === value)?.name || "Select Project" : "Select Project"}
          </span>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 6.5L7.5 9.5L10.5 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="py-1">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                  onClick={() => handleSelect(project.id)}
                >
                  {project.id} - {project.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // We don't need these components anymore since we've simplified the Select implementation
  const SelectTrigger = () => null;
  const SelectValue = () => null;
  const SelectContent = () => null;
  const SelectItem = () => null;
  
  const Alert = ({ children, className }) => (
    <div className={`p-3 rounded-md ${className || ''}`}>
      {children}
    </div>
  );
  
  const AlertDescription = ({ children }) => (
    <div className="ml-2 text-sm">{children}</div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="bg-white shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-blue-50 py-4 px-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-indigo-700 text-2xl">
                <Calendar className="h-7 w-7 mr-2 text-indigo-600" />
                Weekly Time Allocation
              </CardTitle>
            </div>
            <div className="flex items-center">
              <div className="text-lg font-medium text-indigo-600">John Doe</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-8 px-6">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              className="text-gray-600 flex items-center hover:bg-gray-100" 
              onClick={goToPreviousWeek}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span>Prev</span>
            </Button>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setIsPinned(!isPinned)} 
                className={`mr-2 ${isPinned ? 'text-amber-600' : 'text-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22"></line>
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                </svg>
              </Button>
              <span className="text-xl font-medium text-gray-800">
                Week of {formatWeekRange(currentWeek)}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              className="text-gray-600 flex items-center hover:bg-gray-100" 
              onClick={goToNextWeek}
            >
              <span>Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </div>
          
          {error && error !== "Please select a project for all entries" && error !== "Please enter percentage for all selected projects" && (
            <Alert className="mb-4 bg-red-50 text-red-800 border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex items-center">
                <div className="flex-grow mr-4">
                  <Select 
                    value={entry.projectId} 
                    onValueChange={(value) => updateEntry(entry.id, "projectId", value)}
                    onOpenChange={(open) => setIsAnyDropdownOpen(open)}
                  />
                </div>
                
                <div className="flex items-center gap-1 mr-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder=""
                    value={entry.percentage}
                    onChange={(e) => updateEntry(entry.id, "percentage", e.target.value)}
                    className="w-8 text-center border rounded-md px-1 py-2"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                
                {entries.length > 1 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => removeEntry(entry.id)}
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full flex items-center justify-center"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
                {entries.length === 1 && <div className="w-9" />}
              </div>
            ))}
            
            {/* Add button below the last entry */}
            <div className="mt-2">
              <Button 
                variant="outline" 
                onClick={addEntry}
                disabled={isAnyDropdownOpen}
                className="w-full border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 py-3 rounded-lg"
              >
                <div className="flex items-center justify-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Project
                </div>
              </Button>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
            <div className="w-1/3"></div>
            
            <Button 
              onClick={submitTimesheet} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-12 rounded-md text-lg"
              disabled={isButtonDisabled()}
            >
              Submit
            </Button>
            
            <div className="flex items-center w-1/3 justify-end text-xl">
              <span className="mr-2 font-medium">Total:</span>
              <span className={calculateTotal() === 100 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {calculateTotal()}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyPercentageTracker; 