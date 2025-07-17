# Server Action Handling Guide

A comprehensive guide for implementing type-safe server actions with centralized error handling using `createSafeAction` and `useAction` patterns.

## Table of Contents

1. [Overview](#overview)
2. [Setup and Dependencies](#setup-and-dependencies)
3. [Step 1: Create Safe Action Utility](#step-1-create-safe-action-utility)
4. [Step 2: Create useAction Hook](#step-2-create-useaction-hook)
5. [Step 3: Creating Server Actions](#step-3-creating-server-actions)
6. [Step 4: Using Actions in Client Components](#step-4-using-actions-in-client-components)
7. [Step 5: Error Display Components](#step-5-error-display-components)
8. [Step 6: Advanced Patterns](#step-6-advanced-patterns)
9. [Complete Examples](#complete-examples)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

This pattern provides:
- **Type Safety**: Full TypeScript support with proper error types
- **Validation**: Automatic input validation using Zod schemas
- **Error Separation**: Distinguishes field errors from general errors
- **Loading States**: Automatic loading state management
- **Consistent UX**: Standardized error handling across the application

### Architecture Flow

```
User Input → useAction Hook → createSafeAction → Server Handler → Response → UI Updates
```

## Setup and Dependencies

Install required dependencies:

```bash
npm install zod sonner
npm install @types/react react-hook-form @hookform/resolvers
```

Required imports across the application:
```typescript
import { z } from 'zod'
import { toast } from 'sonner'
```

## Step 1: Create Safe Action Utility

Create `lib/create-safe-action.ts`:

```typescript
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
```

## Step 2: Create useAction Hook

Create `hooks/useAction.ts`:

```typescript
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
```

## Step 3: Creating Server Actions

### 3.1 Define Zod Schema

Create `actions/[feature]/schema.ts`:

```typescript
import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### 3.2 Define Types

Create `actions/[feature]/types.ts`:

```typescript
import { ActionState } from '@/lib/create-safe-action';
import { CreateUserInput } from './schema';

// Define what your action returns on success
export type CreateUserOutput = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

// Define the complete action state
export type CreateUserState = ActionState<CreateUserInput, CreateUserOutput>;
```

### 3.3 Create Server Action Handler

Create `actions/[feature]/index.ts`:

```typescript
'use server';

import { createSafeAction } from '@/lib/create-safe-action';
import { CreateUserSchema } from './schema';
import { CreateUserState } from './types';
import { revalidatePath } from 'next/cache';
// Import your database/API clients
// import db from '@/lib/db';

const createUserHandler = async (data: CreateUserInput): Promise<CreateUserState> => {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return { error: 'Unauthorized' };
  }

  try {
    // Business logic validation
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Database operation
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
      },
    });

    // Revalidate cache if needed
    revalidatePath('/users');

    // Return success data
    return { 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return { error: 'Failed to create user. Please try again.' };
  }
};

// Export the safe action
export const createUser = createSafeAction(
  CreateUserSchema,
  createUserHandler,
);
```

## Step 4: Using Actions in Client Components

### 4.1 Basic Usage Pattern

```typescript
'use client';

import { useAction } from '@/hooks/useAction';
import { createUser } from '@/actions/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CreateUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const { execute, fieldErrors, error, isLoading, data } = useAction(createUser, {
    onSuccess: (data) => {
      toast.success(`User ${data.name} created successfully!`);
      formRef.current?.reset();
      router.push(`/users/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
    onComplete: () => {
      // Called regardless of success/failure
      // Useful for cleanup, analytics, etc.
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    execute({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          name="name"
          placeholder="Full Name"
          disabled={isLoading}
          className="w-full p-2 border rounded"
        />
        {/* Display field-specific errors */}
        <FieldErrors id="name" errors={fieldErrors} />
      </div>

      <div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          disabled={isLoading}
          className="w-full p-2 border rounded"
        />
        <FieldErrors id="email" errors={fieldErrors} />
      </div>

      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          disabled={isLoading}
          className="w-full p-2 border rounded"
        />
        <FieldErrors id="password" errors={fieldErrors} />
      </div>

      {/* Display general errors */}
      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 4.2 Advanced Usage with React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, CreateUserInput } from '@/actions/user/schema';

export function CreateUserFormAdvanced() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors }
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
  });

  const { execute, fieldErrors, isLoading } = useAction(createUser, {
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.name}!`);
      reset();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (data: CreateUserInput) => {
    execute(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('name')}
          placeholder="Full Name"
          disabled={isLoading}
        />
        {/* Show client-side validation errors OR server-side field errors */}
        {formErrors.name && <p className="text-red-500">{formErrors.name.message}</p>}
        {fieldErrors?.name && <FieldErrors id="name" errors={fieldErrors} />}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 4.3 Using Toast Promises for Better UX

```typescript
const { execute } = useAction(createUser, {
  onSuccess: (data) => {
    // Don't show toast here, let toast.promise handle it
    router.push(`/users/${data.id}`);
  },
  onError: () => {
    // Don't show toast here either
  },
});

const handleSubmit = (data: CreateUserInput) => {
  toast.promise(
    execute(data),
    {
      loading: 'Creating user...',
      success: 'User created successfully!',
      error: 'Failed to create user',
    }
  );
};
```

## Step 5: Error Display Components

### 5.1 Basic Field Errors Component

Create `components/FieldErrors.tsx`:

```typescript
import { XCircle } from 'lucide-react';

interface FieldErrorsProps {
  id: string;
  errors?: Record<string, string[] | undefined>;
}

export const FieldErrors = ({ id, errors }: FieldErrorsProps) => {
  if (!errors || !errors[id]) {
    return null;
  }

  return (
    <div
      id={`${id}-error`}
      aria-live="polite"
      className="mt-2 text-xs text-rose-500"
    >
      {errors[id]?.map((error: string) => (
        <div
          key={error}
          className="flex items-center rounded-sm border border-rose-500 bg-rose-500/10 p-2 font-medium"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      ))}
    </div>
  );
};
```

### 5.2 Animated Field Errors Component

Create `components/AnimatedFieldErrors.tsx`:

```typescript
import { motion } from 'framer-motion';

interface AnimatedFieldErrorsProps {
  id: string;
  errors?: Record<string, string[] | undefined>;
}

export const AnimatedFieldErrors = ({ id, errors }: AnimatedFieldErrorsProps) => {
  if (!errors || !errors[id]) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: 'easeInOut',
        type: 'spring',
        damping: 10,
      }}
      id={`${id}-error`}
      aria-live="polite"
      className="mt-2 text-sm"
    >
      {errors[id]?.map((error: string) => (
        <div
          key={error}
          className="flex items-center gap-2 rounded-lg border border-red-600 bg-red-600/10 p-3 font-medium text-red-600"
        >
          {error}
        </div>
      ))}
    </motion.div>
  );
};
```

## Step 6: Advanced Patterns

### 6.1 Multiple Actions in One Component

```typescript
export function UserManagement() {
  const { execute: executeCreate, isLoading: isCreating } = useAction(createUser, {
    onSuccess: () => toast.success('User created!'),
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteUser, {
    onSuccess: () => toast.success('User deleted!'),
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, isLoading: isUpdating } = useAction(updateUser, {
    onSuccess: () => toast.success('User updated!'),
    onError: (error) => toast.error(error),
  });

  const isAnyLoading = isCreating || isDeleting || isUpdating;

  // Component logic...
}
```

### 6.2 Conditional Success Behavior

```typescript
const { execute } = useAction(createUser, {
  onSuccess: (data) => {
    if (data.isFirstTimeUser) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
    toast.success(`Welcome ${data.name}!`);
  },
  onError: (error) => {
    if (error.includes('email')) {
      // Focus email field
      emailInputRef.current?.focus();
    }
    toast.error(error);
  },
});
```

### 6.3 Global Loading State Management

```typescript
// Using Recoil or Zustand for global loading state
import { useRecoilState } from 'recoil';
import { globalLoadingState } from '@/store/atoms';

const [isGlobalLoading, setIsGlobalLoading] = useRecoilState(globalLoadingState);

const { execute } = useAction(createUser, {
  onComplete: () => {
    setIsGlobalLoading(false);
  },
});

const handleSubmit = (data: CreateUserInput) => {
  setIsGlobalLoading(true);
  execute(data);
};
```

## Step 7: Complete Examples

### 7.1 Blog Post Creation Example

```typescript
// actions/blog/schema.ts
export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
  published: z.boolean().default(false),
});

// actions/blog/index.ts
const createPostHandler = async (data: CreatePostInput): Promise<CreatePostState> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'You must be logged in to create a post' };
  }

  try {
    const post = await db.post.create({
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        published: data.published,
        authorId: session.user.id,
        slug: generateSlug(data.title),
      },
    });

    revalidatePath('/blog');
    if (data.published) {
      revalidatePath('/');
    }

    return { data: post };
  } catch (error) {
    console.error('Create post error:', error);
    return { error: 'Failed to create post. Please try again.' };
  }
};

export const createPost = createSafeAction(CreatePostSchema, createPostHandler);

// components/CreatePostForm.tsx
export function CreatePostForm() {
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const router = useRouter();

  const { execute, fieldErrors, isLoading } = useAction(createPost, {
    onSuccess: (data) => {
      toast.success(`Post "${data.title}" created successfully!`);
      if (data.published) {
        router.push(`/blog/${data.slug}`);
      } else {
        router.push('/blog/drafts');
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    
    execute({
      title: formData.get('title') as string,
      content,
      tags,
      published: formData.get('published') === 'on',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          name="title"
          placeholder="Post Title"
          className="w-full p-3 border rounded-lg"
          disabled={isLoading}
        />
        <FieldErrors id="title" errors={fieldErrors} />
      </div>

      <div>
        <MarkdownEditor value={content} onChange={setContent} />
        <FieldErrors id="content" errors={fieldErrors} />
      </div>

      <div>
        <TagInput tags={tags} onTagsChange={setTags} />
        <FieldErrors id="tags" errors={fieldErrors} />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Draft'}
        </button>
        
        <button
          type="submit"
          name="published"
          value="on"
          disabled={isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
```

## Step 8: Best Practices

### 8.1 Error Message Guidelines

```typescript
// ❌ Poor error messages
return { error: 'Error' };
return { error: 'Something went wrong' };

// ✅ Good error messages
return { error: 'Unable to create user. Email already exists.' };
return { error: 'Invalid password. Must be at least 8 characters.' };
return { error: 'Connection failed. Please check your internet and try again.' };
```

### 8.2 Validation Best Practices

```typescript
// ❌ Poor validation
const schema = z.object({
  email: z.string(),
  password: z.string(),
});

// ✅ Good validation
const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});
```

### 8.3 Loading State Management

```typescript
// ❌ Poor loading states
<button disabled={isLoading}>Submit</button>

// ✅ Good loading states
<button disabled={isLoading} className="relative">
  {isLoading && <Spinner className="absolute left-2" />}
  <span className={isLoading ? 'invisible' : ''}>
    {isLoading ? 'Creating...' : 'Create User'}
  </span>
</button>
```

### 8.4 Error Recovery

```typescript
const { execute, error, setFieldErrors } = useAction(createUser, {
  onError: (error) => {
    if (error.includes('network')) {
      // Show retry option
      setShowRetryButton(true);
    }
    toast.error(error);
  },
});

const handleRetry = () => {
  setShowRetryButton(false);
  setFieldErrors(undefined);
  execute(lastSubmittedData);
};
```

## Step 9: Testing

### 9.1 Testing Server Actions

```typescript
// __tests__/actions/createUser.test.ts
import { createUser } from '@/actions/user';

describe('createUser action', () => {
  it('should create user with valid data', async () => {
    const result = await createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data?.name).toBe('John Doe');
  });

  it('should return field errors for invalid data', async () => {
    const result = await createUser({
      name: '',
      email: 'invalid-email',
      password: '123',
    });

    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.name).toContain('Name is required');
    expect(result.fieldErrors?.email).toContain('Invalid email format');
  });
});
```

### 9.2 Testing useAction Hook

```typescript
// __tests__/hooks/useAction.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAction } from '@/hooks/useAction';

const mockAction = jest.fn();

describe('useAction hook', () => {
  it('should handle successful action', async () => {
    mockAction.mockResolvedValue({ data: { id: '1', name: 'Test' } });
    
    const { result } = renderHook(() => useAction(mockAction, {
      onSuccess: jest.fn(),
    }));

    await act(async () => {
      await result.current.execute({ name: 'Test' });
    });

    expect(result.current.data).toEqual({ id: '1', name: 'Test' });
    expect(result.current.isLoading).toBe(false);
  });
});
```

## Step 10: Troubleshooting

### Common Issues and Solutions

#### 1. "Action not found" or Import Errors
```typescript
// ❌ Wrong import
import { createUser } from '@/actions/user/index';

// ✅ Correct import
import { createUser } from '@/actions/user';
```

#### 2. TypeScript Errors with Zod
```typescript
// ❌ Type mismatch
const result = await execute(formData); // FormData is not the expected type

// ✅ Correct typing
const result = await execute({
  name: formData.get('name') as string,
  email: formData.get('email') as string,
});
```

#### 3. Server Action Not Running
```typescript
// ❌ Missing 'use server'
export const createUser = createSafeAction(schema, handler);

// ✅ With 'use server'
'use server';
export const createUser = createSafeAction(schema, handler);
```

#### 4. Infinite Re-renders
```typescript
// ❌ Recreating callbacks on every render
const { execute } = useAction(action, {
  onSuccess: () => toast.success('Success'), // New function every render
});

// ✅ Using useCallback or stable references
const onSuccess = useCallback(() => {
  toast.success('Success');
}, []);

const { execute } = useAction(action, { onSuccess });
```

### Performance Optimization

1. **Memoize action callbacks** when they don't depend on changing values
2. **Use React.memo** for error display components
3. **Debounce form submissions** for better UX
4. **Cache action results** when appropriate

### Security Considerations

1. **Always validate on the server** - client validation is for UX only
2. **Check authentication/authorization** in every action handler
3. **Sanitize user inputs** before database operations
4. **Use environment variables** for sensitive configuration
5. **Log errors appropriately** without exposing sensitive data

---

This guide provides a complete foundation for implementing type-safe server actions with centralized error handling. The pattern scales well across different features and provides excellent developer and user experience.
