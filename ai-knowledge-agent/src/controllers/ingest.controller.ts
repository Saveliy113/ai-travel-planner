import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import IngestService from '../services/ingest.service';
import { IngestStartBodyDto } from '../dtos/ingest.dto';

type IngestStartRequest = Request<unknown, unknown, IngestStartBodyDto>;

class IngestController {
  private ingestService = new IngestService();

  public start = async (
    req: IngestStartRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.ingestService.start(req.body);
      res.status(202).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [IngestController] [start]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default IngestController;
