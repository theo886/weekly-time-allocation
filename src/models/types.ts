export interface Project {
  id: number | string;
  name: string;
  code: string;
}

export interface TimeEntry {
  id: number;
  projectId: string;
  percentage: string;
  isManuallySet: boolean;
}

export interface TimeSheet {
  weekStarting: string;
  entries: {
    projectId: string;
    projectName?: string;
    percentage: string;
  }[];
  total: number;
} 