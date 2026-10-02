import { Schema, model, InferSchemaType } from 'mongoose';

export const ROLES = ['CITIZEN', 'PUBLIC_SERVANT', 'ADMIN'] as const;
export const ACCOUNT_STATUSES = ['ACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export type Role = (typeof ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, required: true, default: 'CITIZEN', immutable: true, index: true },
  preferredLanguage: { type: String, default: 'en' },
  city: String, state: String,
  department: String, designation: String,
  municipalityId: { type: Schema.Types.ObjectId, ref: 'Municipality' },
  municipalityName: String,
  ward: String, officialId: String,
  // Jurisdiction, assigned by an administrator when a public servant is approved.
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  jurisdictionWards: { type: [String], default: [] }, // empty = whole municipality
  statusReason: String, // reason given for the last reject/suspend
  accountStatus: { type: String, enum: ACCOUNT_STATUSES, required: true, default: 'ACTIVE', index: true },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => { delete ret.passwordHash; delete ret.__v; return ret; },
});

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
