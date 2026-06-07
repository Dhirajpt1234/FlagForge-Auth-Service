export default interface EnvironmentResponseDTO {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  isDefault: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
