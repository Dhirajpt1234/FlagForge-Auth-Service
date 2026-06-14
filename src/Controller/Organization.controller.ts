import type { Request, Response } from 'express';
import type IOrganizationService from '../Service/IOrganizationService';
import type OrganizationCreationDataDTO from '../DTO/OrganizationCreationData.dto';
import type OrganizationUpdateRequestDTO from '../DTO/OrganizationUpdateRequest.dto';
import type MemberRoleUpdateRequestDTO from '../DTO/MemberRoleUpdateRequest.dto';
import { sendSuccessResponse } from '../Utils/ApiResponse.util';
import { asyncHandler } from '../Middleware/exceptionHandler.middleware';
import type { OrgContextRequest } from '../Middleware/orgContext.middleware';
import logger from '../Utils/logger.util';

export default class OrganizationController {
  private organizationService: IOrganizationService;

  constructor(organizationService: IOrganizationService) {
    this.organizationService = organizationService;
  }

  createOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto: OrganizationCreationDataDTO = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.createOrganization(dto, userId);
    
    res.status(201).json(sendSuccessResponse('Organization created successfully', 201, result));
  });

  getUserOrganizations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.getUserOrganizations(userId);
    
    res.json(sendSuccessResponse('Organizations retrieved successfully', 200, result));
  });

  getOrganizationById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.getOrganizationById(id as string, userId);
    
    res.json(sendSuccessResponse('Organization retrieved successfully', 200, result));
  });

  getAllOrganizations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.organizationService.getAllOrganizations();
    
    res.json(sendSuccessResponse('All organizations retrieved successfully', 200, result));
  });

  updateOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto: OrganizationUpdateRequestDTO = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.updateOrganization(id as string, userId, dto);
    
    res.json(sendSuccessResponse('Organization updated successfully', 200, result));
  });

  deleteOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.organizationService.deleteOrganization(id as string, userId);
    
    res.json(sendSuccessResponse('Organization deleted successfully', 200));
  });

  getOrganizationMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.getOrganizationMembers(id as string, userId);
    
    res.json(sendSuccessResponse('Organization members retrieved successfully', 200, result));
  });

  updateMemberRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: orgId, userId: targetUserId } = req.params;
    const dto: MemberRoleUpdateRequestDTO = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.organizationService.updateMemberRole(
      orgId as string, 
      userId, 
      targetUserId as string, 
      dto.role as any
    );
    
    res.json(sendSuccessResponse('Member role updated successfully', 200, result));
  });

  removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: orgId, userId: targetUserId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.organizationService.removeMember(orgId as string, userId, targetUserId as string);
    
    res.json(sendSuccessResponse('Member removed successfully', 200));
  });

  exitOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: orgId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.organizationService.exitOrganization(orgId as string, userId);
    
    res.json(sendSuccessResponse('Exited organization successfully', 200));
  });
}
