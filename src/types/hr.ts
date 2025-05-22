export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Leave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: 'annual' | 'sick' | 'unpaid' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonus: number;
  total_salary: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  salary_range: string;
  status: 'open' | 'closed' | 'on_hold';
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_name: string;
  email: string;
  phone: string;
  experience_years: number;
  education: string;
  status: 'new' | 'under_review' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
}
