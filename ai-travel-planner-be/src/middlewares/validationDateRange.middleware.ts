import { Request, Response, NextFunction } from 'express';

/**
 * Runs after TravelPlannerInputDto validation. Ensures endDate >= startDate when both are present.
 */
function validationDateRangeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const { startDate, endDate } = req.body as { startDate?: string; endDate?: string };

  if (startDate && endDate && endDate < startDate) {
    res.status(422).json({
      errCode: -1,
      errMsg: 'Validation failed',
      errors: [{ paramName: 'endDate', message: 'endDate must be on or after startDate' }],
    });
    return;
  }

  next();
}

export default validationDateRangeMiddleware;
