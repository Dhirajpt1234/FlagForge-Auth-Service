import type { Request, Response } from 'express';
import type IInvitationService from '../Service/IInvitationService';
import type CreateInvitationRequestDTO from '../DTO/InvitationRequest.dto';
import { AcceptInvitationRequestDTO } from '../DTO/InvitationRequest.dto';
import { sendSuccessResponse } from '../Utils/ApiResponse.util';
import { asyncHandler } from '../Middleware/exceptionHandler.middleware';
import type { OrgContextRequest } from '../Middleware/orgContext.middleware';
import log from '../Utils/logger.util';

export default class InvitationController {
  private invitationService: IInvitationService;

  constructor(invitationService: IInvitationService) {
    this.invitationService = invitationService;
  }

  createInvitation = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const orgId = req.user?.orgId;
    const userId = req.user?.userId;
    
    if (!orgId || !userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const dto: CreateInvitationRequestDTO = req.body;

    log.info("Creating invitation", { orgId, userId, dto });

    const result = await this.invitationService.createInvitation(orgId, userId, dto);
    
    res.status(201).json(sendSuccessResponse('Invitation sent successfully', 201, result));
  });

  acceptInvitation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const userData: AcceptInvitationRequestDTO = req.body;
    
    const result = await this.invitationService.acceptInvitation(token as string, userData);
    
    res.json(sendSuccessResponse('Invitation accepted successfully', 200, result));
  });

  listInvitations = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const orgId = req.user?.orgId;
    const { status } = req.query;
    const statusValue = Array.isArray(status) ? status[0] : status;
    
    if (!orgId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const result = await this.invitationService.listInvitations(orgId, statusValue as string);
    
    res.json(sendSuccessResponse('Invitations retrieved successfully', 200, result));
  });

  revokeInvitation = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { invitationId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.invitationService.revokeInvitation(invitationId as string, userId);
    
    res.json(sendSuccessResponse('Invitation revoked successfully', 200));
  });

  resendInvitation = asyncHandler(async (req: OrgContextRequest, res: Response): Promise<void> => {
    const { invitationId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    await this.invitationService.resendInvitation(invitationId as string, userId);
    
    res.json(sendSuccessResponse('Invitation resent successfully', 200));
  });

  getInvitationByInvitationId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { invitationId } = req.params;
    
    const result = await this.invitationService.getInvitationByInvitationId(invitationId as string);
    
    if (!result) {
      res.status(404).json(sendSuccessResponse('Invitation not found', 404));
      return;
    }
    
    res.json(sendSuccessResponse('Invitation retrieved successfully', 200, result));
  });

  getInvitationByToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    
    const result = await this.invitationService.getInvitationByToken(token as string);
    
    if (!result) {
      res.status(404).json(sendSuccessResponse('Invitation not found', 404));
      return;
    }
    
    res.json(sendSuccessResponse('Invitation retrieved successfully', 200, result));
  });
}
