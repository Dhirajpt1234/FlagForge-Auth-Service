import type { InvitationResponseDTO, AcceptInvitationRequestDTO, InvitationListResponseDTO } from '../DTO/InvitationRequest.dto';
import type AuthResponseDTO from '../DTO/AuthResponse.dto';
import type CreateInvitationRequestDTO from '../DTO/InvitationRequest.dto';

export default interface IInvitationService {
  createInvitation(orgId: string, invitedById: string, data: CreateInvitationRequestDTO): Promise<InvitationResponseDTO>;
  acceptInvitation(token: string, userData: AcceptInvitationRequestDTO): Promise<AuthResponseDTO>;
  listInvitations(orgId: string, status?: string): Promise<InvitationListResponseDTO>;
  revokeInvitation(invitationId: string, userId: string): Promise<void>;
  resendInvitation(invitationId: string, userId: string): Promise<void>;
  getInvitationByInvitationId(invitationId: string): Promise<InvitationResponseDTO | null>;
  getInvitationByToken(token: string): Promise<InvitationResponseDTO | null>;
}
