export interface HeirBase {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface Heir extends HeirBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type HeirFormData = Omit<Heir, 'id' | 'createdAt' | 'updatedAt'>;
