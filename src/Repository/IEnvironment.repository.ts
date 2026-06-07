export interface EnvironmentData {
  name: string;
  key: string;
  description?: string;
  isDefault?: boolean;
}

export interface EnvironmentUpdateData {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export default interface IEnvironmentRepository {
  create(data: EnvironmentData, organizationId: string, createdById: string): Promise<any>;
  findById(id: string, organizationId: string): Promise<any | null>;
  findByOrganization(organizationId: string): Promise<any[]>;
  update(id: string, organizationId: string, data: EnvironmentUpdateData): Promise<any>;
  delete(id: string, organizationId: string): Promise<void>;
  findByKey(key: string, organizationId: string): Promise<any | null>;
}
