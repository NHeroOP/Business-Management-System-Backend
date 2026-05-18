import type { Request, Response, NextFunction } from "express"


interface AsyncHandlerFunction {
  (arg0: any, arg1: any, arg2: any): any
}

export const asyncHandler = (fn: AsyncHandlerFunction) => (
   (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err))
  }
)