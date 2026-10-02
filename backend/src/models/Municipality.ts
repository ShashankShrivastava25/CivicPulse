import { Schema, model } from 'mongoose';

export const ACTIVE_STATES = ['ACTIVE', 'INACTIVE'] as const;

const municipalitySchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['NAGAR_NIGAM', 'NAGAR_PALIKA', 'NAGAR_PANCHAYAT', 'OTHER'], default: 'OTHER' },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  wards: { type: [String], default: [] },
  status: { type: String, enum: ACTIVE_STATES, default: 'ACTIVE', index: true },
}, { timestamps: true });
municipalitySchema.index({ name: 1, city: 1, state: 1 }, { unique: true });

export const Municipality = model('Municipality', municipalitySchema);
