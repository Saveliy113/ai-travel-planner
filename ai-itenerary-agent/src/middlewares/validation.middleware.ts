import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

type Location = 'body' | 'query' | 'params';

type ValidationErrorItem = { paramName: string; message: string };

function collectDescendantMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      messages.push(...collectDescendantMessages(error.children));
    }
  }
  return messages;
}

/** One row per validated property; nested failures (e.g. array items) roll up under the parent path. */
function flattenValidationErrors(errors: ValidationError[], parentPath = ''): ValidationErrorItem[] {
  const out: ValidationErrorItem[] = [];
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.children?.length) {
      const own = error.constraints ? Object.values(error.constraints) : [];
      const nested = collectDescendantMessages(error.children);
      const message = [...new Set([...own, ...nested])].join('; ') || 'Validation failed';
      out.push({ paramName: path, message });
      continue;
    }
    if (error.constraints) {
      out.push({ paramName: path, message: Object.values(error.constraints).join(', ') });
    }
  }
  return out;
}

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
        errors: flattenValidationErrors(errors),
      });
      return;
    }

    next();
  };
};

export default validateDto;
