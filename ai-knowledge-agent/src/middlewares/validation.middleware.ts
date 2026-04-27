import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

type Location = 'body' | 'query' | 'params';

const validateDto = <T extends object>(dtoClass: new () => T, location: Location) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (location === 'body' && (!req.body || Object.keys(req.body).length === 0)) {
      return next({ status: 400, message: 'Empty request body' });
    }

    const source = req[location];

    const dtoObject = plainToInstance(dtoClass, source);

    const errors = await validate(dtoObject, { whitelist: true });

    if (errors.length > 0) {
      res.status(422).json({
        errCode: -1,
        errMsg: 'Validation failed',
        errors: errors.map((e) => ({
          paramName: e.property,
          message: Object.values(e.constraints || {}).join(', '),
        })),
      });
      return;
    }

    req[location] = dtoObject;

    next();
  };
};

export default validateDto;
