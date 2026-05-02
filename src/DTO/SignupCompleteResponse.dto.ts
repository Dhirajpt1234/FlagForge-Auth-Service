import type UserResponseDTO from './UserResponse.dto';
import type OrganizationResponseDTO from './OrganizationResponse.dto';

export default interface SignupCompleteResponseDTO {
  user: UserResponseDTO;
  organization: OrganizationResponseDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
