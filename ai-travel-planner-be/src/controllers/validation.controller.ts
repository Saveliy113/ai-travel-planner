import { Request, Response, NextFunction } from 'express';

import ValidationService from '../services/validation.service';
import { logger } from '../utils/logger';

class ValidationController {
  private validationService = new ValidationService();

  public validateDestination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.validationService.validateDestination(req.body.destination as string);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [ValidationController] [validateDestination]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default ValidationController;
