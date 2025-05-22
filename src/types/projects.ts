import { Employee } from './hr';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type Priority = 'low' | 'medium' | 'high';
export type MemberRole = 'manager' | 'member' | 'viewer';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: ProjectStatus;
  budget: number;
  client: string;
  manager_id: string;
  priority: Priority;
  progress: number;
  created_at: string;
  updated_at: string;
  manager?: Employee;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  priority: Priority;
  progress: number;
  created_at: string;
  updated_at: string;
  assignee?: Employee;
  project?: Project;
}

export interface ProjectMember {
  project_id: string;
  employee_id: string;
  role: MemberRole;
  created_at: string;
  employee?: Employee;
  project?: Project;
}
