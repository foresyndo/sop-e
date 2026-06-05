export type UserRole = "Super Admin" | "Direktur" | "Project Manager" | "Admin" | "Supervisor" | "Staff";

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface SopContent {
  purpose: string;
  scope: string;
  responsibility: string[];
  procedure: string[];
  checklist: string[];
  supportForms: string[];
}

export interface SopRevision {
  revisionNo: number;
  updatedBy: string;
  updatedAt: string;
  changeSummary: string;
}

export interface Sop {
  id: string;
  title: string;
  category: string;
  contentPurpose: string;
  contentScope: string;
  contentResponsibility: string; // Combined text or split
  contentProcedure: string;      // Steps split by lines or serialized
  contentChecklist: string;      // Check list split by lines or serialized
  contentSupportForms: string;  // Forms split by lines or serialized
  author: string;
  authorId: string;
  status: "Draft" | "Reviewing" | "Approved";
  isTemplate?: boolean;
  revisionHistory?: string; // Serialized string of SopRevision[] or text
  createdAt: string;
}

export interface SCurvePoint {
  month: string;
  planned: number;
  actual: number;
}

export interface ProjectDoc {
  title: string;
  url: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  client: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  physicalProgress: number; // 0-100
  financialProgress: number; // 0-100
  sCurveData: string; // Serialized SCurvePoint[]
  documentation: string; // Serialized ProjectDoc[]
  description?: string;
  estimatedCost?: number;
  actualExpense?: number;
  overheadCost?: number;
  changeOrders?: string; // Serialized ChangeOrder[]
  paymentTerms?: string; // Serialized PaymentTerm[]
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  amount: number; // positive for addon/addendum, negative for reduction
  status: "Draft" | "Disetujui" | "Ditolak";
  date: string;
}

export interface PaymentTerm {
  id: string;
  termName: string;
  percentage: number; // percentage of the contract value (e.g. 20%)
  amount: number;     // value of this term (e.g. 200,000,000)
  status: "Belum Tagih" | "Sudah Tagih" | "Lunas";
  dueDate: string;
}

export interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent" | "Leave" | "Sick";
  checkIn: string;
  checkOut: string;
}

export interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export interface PerformanceReview {
  date: string;
  score: number; // 1-5 or 0-100
  feedback: string;
  reviewer: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  division: string;
  status: "Permanent" | "Contract" | "Daily";
  attendance: string; // Serialized AttendanceRecord[]
  leaves: string; // Serialized LeaveRequest[]
  performanceReviews: string; // Serialized PerformanceReview[]
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  projectHistory: string; 
  phone?: string;
  status?: "Lead" | "Tender" | "Kontrak Aktif" | "Selesai";
  notes?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  project: string;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl: string; 
  fileType: string; 
  fileSize?: string;
  associatedProjectId?: string;
  associatedProjectName?: string;
  uploader?: string;
}

export interface Report {
  id: string;
  title: string;
  project: string;
  notes: string;
  createdAt: string;
  status: "Draft" | "Final";
}
