export default interface IInvitationRepository {
  create(data: {
    organizationId: string;
    email: string;
    role: string;
    token: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
  }>;
  
  findByInvitationId(invitationId: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null>;

  findByToken(token: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null>;
  
  findByOrgAndEmail(organizationId: string, email: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
  } | null>;
  
  findByOrganization(organizationId: string, status?: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[]>;
  
  updateStatus(id: string, status: string): Promise<void>;
  
  deleteById(id: string): Promise<void>;
  
  findExpiredInvitations(): Promise<{
    id: string;
    organizationId: string;
    email: string;
    token: string;
  }[]>;
}
