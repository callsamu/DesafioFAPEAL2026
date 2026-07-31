import { ZodError } from 'zod';

export function formatZodError(error: ZodError): string[] {
  return error.issues
    .map((issue) => {
      const field = issue.path.join('.');
      return field ? `'${field}': ${issue.message}` : issue.message;
    })
}
