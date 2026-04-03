import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Post content is required')
    .max(2000, 'Post cannot exceed 2000 characters'),
  visibility: z.enum(['public', 'private']).optional(),
});

const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment cannot exceed 1000 characters'),
  parentComment: z
    .string()
    .regex(objectIdRegex, 'Invalid parent comment ID')
    .optional(),
});

const registerRules = validateBody(registerSchema);
const loginRules = validateBody(loginSchema);
const createPostRules = validateBody(createPostSchema);
const createCommentRules = validateBody(createCommentSchema);

export { validateBody, registerRules, loginRules, createPostRules, createCommentRules };
