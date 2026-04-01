import { UserRole } from '@prisma/client';

export type ILoginUser = {
  email: string;
  password?: string;
};

export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};
