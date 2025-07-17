// Custom hook for executing server actions with comprehensive state management
// Provides loading states, error handling, and success callbacks

import { useState, useCallback } from 'react';
import { ActionState, FieldErrors } from '@/lib/create-safe-action';

type Action<TInput, TOutput> = (
  data: TInput,
) => Promise<ActionState<TInput, TOutput>>;

/**
 * UseActionOptions Interface
 * Optional callback functions for different action outcomes:
 * - onSuccess: Called when action completes successfully with data
 * - onError: Called when action fails with error message
 * - onComplete: Called after action finishes (success or failure)
 */
interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

/**
 * useAction Hook
 * Manages the complete lifecycle of server actions with comprehensive state management.
 * 
 * @param action - The server action to execute
 * @param options - Optional callbacks for different outcomes
 * @returns Object with execute function and state variables
 * 
 * State Management:
 * - fieldErrors: Field-specific validation errors
 * - error: General error messages
 * - data: Success response data
 * - isLoading: Loading state indicator
 */
export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {},
) => {
  // State Management
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Execute Function
   * Executes the server action with comprehensive state management.
   * 
   * Flow:
   * 1. Set loading state to true
   * 2. Execute the action
   * 3. Process the result based on type (fieldErrors, error, or data)
   * 4. Call appropriate callbacks
   * 5. Always reset loading state
   */
  const execute = useCallback(
    async (input: TInput) => {
      // Phase 1: Start loading
      setIsLoading(true);

      try {
        // Phase 2: Execute the action
        const result = await action(input);

        // Phase 3: Handle no result (shouldn't happen but defensive programming)
        if (!result) {
          return;
        }

        // Phase 4: Update field errors state
        setFieldErrors(result.fieldErrors);

        // Phase 5: Handle general errors
        if (result.error) {
          setError(result.error);
          options.onError?.(result.error);
        }

        // Phase 6: Handle success data
        if (result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
        }
      } finally {
        // Phase 7: Always reset loading state and call completion callback
        setIsLoading(false);
        options.onComplete?.();
      }
    },
    [action, options], // Dependencies for useCallback
  );

  // Return all state and functions for component use
  return {
    execute,           // Function to trigger the action
    fieldErrors,       // Current field validation errors
    error,            // Current general error
    data,             // Current success data
    isLoading,        // Current loading state
    setFieldErrors,   // Manual field error setter (useful for form validation)
  };
}; 