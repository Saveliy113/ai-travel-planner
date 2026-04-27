import { NextFunction, Response, Request } from 'express';

import getUserInfo from '../utils/getUserInfo';

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Authorization = req.header('Authorization')?.trim();

    if (!Authorization) {
      throw { status: 401, message: 'Authentication token missing' };
    }

    const accessToken = Authorization.split(' ')[1];

    const user = await getUserInfo(accessToken);

    if (!user || !user.user_name) {
      throw { status: 401, message: 'User not found' };
    }

    res.locals.auth = {
      username: user.user_name,
      userId: user.user_id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
