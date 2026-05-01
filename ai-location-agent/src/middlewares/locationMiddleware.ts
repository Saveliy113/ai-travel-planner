import { NextFunction, Request, Response } from 'express';
import moment from 'moment';

/**
 * Runs after LocationQueryDto validation. Ensures startDate is not in the past
 * and endDate >= startDate.
 */
function LocationQueryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const { startDate, endDate } = req.query;

  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    next();
    return;
  }

  const startDay = moment(startDate, moment.ISO_8601, true);
  const endDay = moment(endDate, moment.ISO_8601, true);

  if (!startDay.isValid() || !endDay.isValid()) {
    next();
    return;
  }

  const startKey = startDay.format('YYYY-MM-DD');
  const endKey = endDay.format('YYYY-MM-DD');
  const todayKey = moment().format('YYYY-MM-DD');

  if (startKey < todayKey) {
    res.status(400).json({ message: 'startDate must be today or a later date' });
    return;
  }

  if (endKey < startKey) {
    res.status(400).json({ message: 'endDate must be greater than or equal to startDate' });
    return;
  }

  next();
}

export default LocationQueryMiddleware;
