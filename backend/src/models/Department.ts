import { Schema, model } from 'mongoose';

/** Default department for each issue category. Used when a department has no explicit category list. */
export const DEFAULT_DEPARTMENTS = ['Sanitation', 'Roads', 'Drainage', 'Water', 'Electricity/Street Lighting', 'Public Works', 'Other'] as const;
export const CATEGORY_DEFAULT_DEPARTMENT: Record<string, string> = {
  Garbage: 'Sanitation', Sanitation: 'Sanitation',
  Drainage: 'Drainage', Waterlogging: 'Drainage',
  'Road Damage': 'Roads', Pothole: 'Roads',
  Streetlight: 'Electricity/Street Lighting',
  'Water Leakage': 'Water',
  'Public Infrastructure': 'Public Works',
  Other: 'Other',
};

const departmentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  municipality: { type: Schema.Types.ObjectId, ref: 'Municipality', index: true },
  categories: { type: [String], default: [] },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });
departmentSchema.index({ name: 1, municipality: 1 }, { unique: true });

export const Department = model('Department', departmentSchema);
