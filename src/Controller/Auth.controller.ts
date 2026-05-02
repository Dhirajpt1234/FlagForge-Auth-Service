import type { Request, Response } from 'express';
import type IAuthService from '../Service/IAuthService';
import type SignupRequestDTO from '../DTO/SignupRequest.dto';
import type SignupCompleteResponseDTO from '../DTO/SignupCompleteResponse.dto';
import type LoginRequestDTO from '../DTO/LoginRequest.dto';
import type RefreshRequestDTO from '../DTO/RefreshRequest.dto';
import { sendSuccessResponse } from '../Utils/ApiResponse.util';
import { asyncHandler } from '../Middleware/exceptionHandler.middleware';

export default class AuthController {
  private authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto: SignupRequestDTO = req.body;
    const result: SignupCompleteResponseDTO = await this.authService.signup(dto);
    
    res.status(201).json(sendSuccessResponse('User and organization created successfully', 201, result));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto: LoginRequestDTO = req.body;
    const result = await this.authService.login(dto);
    
    res.json(sendSuccessResponse('Login successful', 200, result));
  });

  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto: RefreshRequestDTO = req.body;
    const result = await this.authService.refreshToken(dto);
    
    res.json(sendSuccessResponse('Token refreshed successfully', 200, result));
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    await this.authService.logout(refreshToken);
    
    res.json(sendSuccessResponse('Logout successful', 200));
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json(sendSuccessResponse('User not authenticated', 401));
      return;
    }

    const user = await this.authService.getUserById(userId);
    
    if (!user) {
      res.status(404).json(sendSuccessResponse('User not found', 404));
      return;
    }

    res.json(sendSuccessResponse('Profile retrieved successfully', 200, user));
  });
}
