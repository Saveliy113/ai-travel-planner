import { NextFunction, Request, Response } from 'express';
import { AxiosResponse } from 'axios';

const errorMiddleware = (
  error: { status: number; message: string; code: string; response: AxiosResponse },
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const status: number = error.status || 500;
    const message: string | unknown =
      (error.response ? JSON.stringify(error.response.data) : error.message ? error.message : error.toString()) ||
      'Internal server error';

    res.status(status).json({ errCode: error.code || -1, errMsg: message });
  } catch (err) {
    next(err);
  }
};

export default errorMiddleware;
