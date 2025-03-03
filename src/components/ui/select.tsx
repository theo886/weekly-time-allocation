import React, { useState } from 'react';
import { Project } from '../../models/types';

interface SelectProps {
  value: string;
  projects: Project[];
  onValueChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export const Select = ({ 
  value, 
  projects, 
  onValueChange, 
  onOpenChange 
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) onOpenChange(newState);
  };
  
  const handleSelect = (val: string) => {
    onValueChange(val);
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
          {value ? projects.find(p => p.id.toString() === value)?.name || "Select Project" : "Select Project"}
        </span>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 6.5L7.5 9.5L10.5 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="py-1">
            {projects.map(project => (
              <div 
                key={project.id}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                onClick={() => handleSelect(project.id.toString())}
              >
                {project.name} ({project.code})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 