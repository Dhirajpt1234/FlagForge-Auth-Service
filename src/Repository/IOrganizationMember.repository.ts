export default interface IOrganizationMemberRepository {
  create(data: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<void>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string } | null>;
  findByUserId(userId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]>;
  findByOrgId(organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]>;
}
