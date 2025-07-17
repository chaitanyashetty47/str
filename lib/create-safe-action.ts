// This utility provides type-safe server actions with automatic validation
// It defines types for representing errors and action states,
// and validates input data against a Zod schema before processing

import { z } from 'zod';

/**
 * FieldErrors Type
 * Creates a mapped type that mirrors the shape of your input data T.
 * Each property can optionally contain an array of error messages.
 * 
 * Example:
 * If T = { email: string; password: string }
 * Then FieldErrors<T> = { email?: string[]; password?: string[] }
 */
export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

/**
 * ActionState Type
 * Represents the possible states of a server action:
 * - fieldErrors: Field-specific validation errors (from Zod validation)
 * - error: General error message (server errors, business logic errors)
 * - data: Success response data (when action succeeds)
 * 
 * Only one of these will be populated at a time:
 * - Validation Error: fieldErrors populated, no data
 * - Runtime Error: error populated, no data  
 * - Success: data populated, no errors
 */
export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>;
  error?: string | null;
  data?: TOutput;
};

/**
 * createSafeAction Function
 * Creates a type-safe server action with automatic validation.
 * 
 * @param schema - Zod schema for input validation
 * @param handler - Function that processes validated data
 * @returns Promise<ActionState<TInput, TOutput>>
 * 
 * Flow:
 * 1. Validates input data against Zod schema
 * 2. If validation fails: returns fieldErrors
 * 3. If validation passes: calls handler with clean data
 * 4. Returns handler result (success data or error)
 */
export const createSafeAction = <TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>,
) => {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(data);
    
    if (!validationResult.success) {
      return {
        fieldErrors: validationResult.error.flatten()
          .fieldErrors as FieldErrors<TInput>,
      };
    }

    return handler(validationResult.data);
  };
}; 