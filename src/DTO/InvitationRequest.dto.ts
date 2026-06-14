import { OrgRole } from '../Types/OrgRole.enum';

export default interface CreateInvitationRequestDTO {
  email: string;
  role: OrgRole;
}

export interface AcceptInvitationRequestDTO {
  name: string;
  password: string;
}

export interface InvitationResponseDTO {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  token: string;
  invitedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface InvitationListResponseDTO {
  invitations: InvitationResponseDTO[];
  total: number;
}
