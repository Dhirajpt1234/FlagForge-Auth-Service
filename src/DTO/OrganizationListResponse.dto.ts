export default interface OrganizationListResponseDTO {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  memberCount: number;
}
