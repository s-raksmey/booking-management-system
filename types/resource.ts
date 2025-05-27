export type ResourceType = 'EQUIPMENT' | 'SERVICE';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  available: boolean;
  createdAt: number; // UNIX timestamp
  updatedAt: number; // UNIX timestamp
}

export interface CreateResourceInput {
  name: string;
  type: ResourceType;
  available?: boolean;
}

export interface UpdateResourceInput {
  name?: string;
  type?: ResourceType;
  available?: boolean;
}