import type { Request, Response } from 'express';
import type IEnvironmentService from '../Service/IEnvironment.service';
import type EnvironmentCreationDataDTO from '../DTO/EnvironmentCreationData.dto';
import type EnvironmentUpdateRequestDTO from '../DTO/EnvironmentUpdateRequest.dto';
import { sendSuccessResponse } from '../Utils/ApiResponse.util';
import { asyncHandler } from '../Middleware/exceptionHandler.middleware';
import type { OrgContextRequest } from '../Middleware/orgContext.middleware';

export default class EnvironmentController {
  private environmentService: IEnvironmentService;

  constructor(environmentService: IEnvironmentService) {
    this.environmentService = environmentService;
  }

  createEnvironment = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const dto: EnvironmentCreationDataDTO = req.body;
    const { orgId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.environmentService.createEnvironment(dto, orgId as string, userId);
    
    res.status(201).json(sendSuccessResponse('Environment created successfully', 201, result));
  });

  getEnvironmentById = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { id, orgId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.environmentService.getEnvironmentById(id as string, orgId as string, userId);
    
    res.json(sendSuccessResponse('Environment retrieved successfully', 200, result));
  });

  getOrganizationEnvironments = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { orgId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.environmentService.getOrganizationEnvironments(orgId as string, userId);
    
    res.json(sendSuccessResponse('Environments retrieved successfully', 200, result));
  });

  updateEnvironment = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { id, orgId } = req.params;
    const dto: EnvironmentUpdateRequestDTO = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.environmentService.updateEnvironment(id as string, orgId as string, userId, dto);
    
    res.json(sendSuccessResponse('Environment updated successfully', 200, result));
  });

  deleteEnvironment = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { id, orgId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.environmentService.deleteEnvironment(id as string, orgId as string, userId);
    
    res.json(sendSuccessResponse('Environment deleted successfully', 200));
  });
}
