import type EnvironmentResponseDTO from '../DTO/EnvironmentResponse.dto';
import type EnvironmentListResponseDTO from '../DTO/EnvironmentListResponse.dto';
import type EnvironmentCreationDataDTO from '../DTO/EnvironmentCreationData.dto';
import type EnvironmentUpdateRequestDTO from '../DTO/EnvironmentUpdateRequest.dto';

export default interface IEnvironmentService {
  createEnvironment(dto: EnvironmentCreationDataDTO, organizationId: string, userId: string): Promise<EnvironmentResponseDTO>;
  getEnvironmentById(id: string, organizationId: string, userId: string): Promise<EnvironmentResponseDTO>;
  getOrganizationEnvironments(organizationId: string, userId: string): Promise<EnvironmentListResponseDTO>;
  updateEnvironment(id: string, organizationId: string, userId: string, dto: EnvironmentUpdateRequestDTO): Promise<EnvironmentResponseDTO>;
  deleteEnvironment(id: string, organizationId: string, userId: string): Promise<void>;
}
