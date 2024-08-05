import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

interface RequestWithUser extends Express.Request {
  user: User;
}

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
