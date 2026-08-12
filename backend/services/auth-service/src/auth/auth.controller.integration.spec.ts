import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (integration)', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
    seedManager: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('POST login délègue au service', async () => {
    authService.login.mockResolvedValue({ accessToken: 't', user: {} });
    const dto = { email: 'a@test.com', password: 'pass' };
    await expect(controller.login(dto)).resolves.toEqual({ accessToken: 't', user: {} });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
