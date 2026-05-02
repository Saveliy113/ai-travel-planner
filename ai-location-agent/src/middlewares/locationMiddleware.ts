import { NextFunction, Request, Response } from 'express';

function LocationMiddleware(req: Request, res: Response, next: NextFunction): void {
  next();
}

export default LocationMiddleware;
