declare module '*/types/heir' {
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

  export interface HeirFormData extends Omit<Heir, 'id' | 'createdAt' | 'updatedAt'> {}
}
