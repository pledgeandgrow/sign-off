export interface Heir {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface HeirFormData {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  percentage: number;
}
