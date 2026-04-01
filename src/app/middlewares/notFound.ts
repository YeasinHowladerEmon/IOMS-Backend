import { Request, Response, NextFunction } from 'express';
import logger from '../../shared/logger';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  logger.warn('API Not Found:', { url: req.originalUrl });
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
  next();
};

export default notFound;
