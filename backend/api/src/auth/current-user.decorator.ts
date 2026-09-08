import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUserContext {
  id: string;
  email: string;
  name: string;
  workspaceId?: string;
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUserContext;

    return data ? user?.[data] : user;
  },
);
