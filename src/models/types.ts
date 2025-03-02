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
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  weekStarting: string;
  entries: {
    projectId: string;
    projectName?: string;
    percentage: string;
  }[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  name: string;
  email: string;
  tenantId: string;
} 