import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type SchemaOrPicker = ZodTypeAny | ((body: unknown) => ZodTypeAny);

/** Validates and replaces req.body with the parsed (stripped, coerced) result. */
export const validate = (schema: SchemaOrPicker) => (req: Request, _res: Response, next: NextFunction) => {
  const s = typeof schema === 'function' ? schema(req.body) : schema;
  const result = s.safeParse(req.body ?? {});
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};
