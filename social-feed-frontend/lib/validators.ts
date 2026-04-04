import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});


export const createPostSchema = z.object({
  text: z
    .string()
    .min(1, 'Post content is required')
    .max(2000, 'Post cannot exceed 2000 characters'),
  visibility: z.enum(['public', 'private']).default('public'),
});

export const createCommentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});


export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type CreatePostFormValues = z.infer<typeof createPostSchema>;
export type CreateCommentFormValues = z.infer<typeof createCommentSchema>;
