import { z } from 'zod';

export const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' }, { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' }, { code: 'gu', label: 'Gujarati' }, { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' }, { code: 'kn', label: 'Kannada' }, { code: 'ml', label: 'Malayalam' },
  { code: 'pa', label: 'Punjabi' }, { code: 'as', label: 'Assamese' }, { code: 'or', label: 'Odia' },
] as const;
const langCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

const text = (label: string, max = 100) =>
  z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const emailSchema = z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address');
export const phoneSchema = z.string({ required_error: 'Phone is required' }).trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
export const passwordSchema = z.string({ required_error: 'Password is required' })
  .min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter').regex(/[A-Z]/, 'Add an uppercase letter').regex(/\d/, 'Add a number');

const matchPasswords = <T extends { password: string; confirmPassword: string }>(d: T, ctx: z.RefinementCtx) => {
  if (d.password !== d.confirmPassword) ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
};

export const citizenRegisterSchema = z.object({
  accountType: z.literal('CITIZEN'),
  fullName: text('Full name'), email: emailSchema, phone: phoneSchema,
  password: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your password'),
  city: text('City'), state: text('State'),
  preferredLanguage: z.enum(langCodes).default('en'),
}).strict().superRefine(matchPasswords);

export const servantRegisterSchema = z.object({
  accountType: z.literal('PUBLIC_SERVANT'),
  fullName: text('Full name'), email: emailSchema, phone: phoneSchema,
  password: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your password'),
  department: text('Department'), designation: text('Designation'),
  municipalityName: text('Municipality'), ward: text('Ward', 50), officialId: text('Official ID', 50),
  city: text('City'), state: text('State'),
  preferredLanguage: z.enum(langCodes).default('en'),
}).strict().superRefine(matchPasswords);

/** Picks the schema from accountType. Only CITIZEN and PUBLIC_SERVANT exist, so ADMIN can never be registered. */
export function registerSchemaFor(body: unknown) {
  const t = (body as { accountType?: string } | null)?.accountType;
  return t === 'PUBLIC_SERVANT' ? servantRegisterSchema : citizenRegisterSchema;
}

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
}).strict();

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is missing'),
  password: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your password'),
}).strict().superRefine(matchPasswords);

/** Only these fields may be edited by the user. Role, status, department etc. are not editable. */
export const updateProfileSchema = z.object({
  fullName: text('Full name'), phone: phoneSchema, city: text('City'), state: text('State'),
  preferredLanguage: z.enum(langCodes),
}).strict();

export type CitizenRegisterInput = z.infer<typeof citizenRegisterSchema>;
export type ServantRegisterInput = z.infer<typeof servantRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
