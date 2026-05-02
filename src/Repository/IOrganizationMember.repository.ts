export default interface IOrganizationMemberRepository {
  create(data: {
    organizationId: string;
    userId: string;
    role: string;
  }): Promise<void>;
}
