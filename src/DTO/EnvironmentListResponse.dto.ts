import EnvironmentResponseDTO from './EnvironmentResponse.dto';

export default interface EnvironmentListResponseDTO {
  environments: EnvironmentResponseDTO[];
  total: number;
}
