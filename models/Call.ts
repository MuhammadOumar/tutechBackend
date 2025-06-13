import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
  from: string;
  to: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed';
  duration: number;
  recordingUrl?: string;
  timestamp: Date;
  action: 'forwarded' | 'voicemail';
  forwardedTo?: string;
}

const CallSchema: Schema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['ringing', 'in-progress', 'completed', 'failed'],
    default: 'ringing'
  },
  duration: { type: Number, default: 0 },
  recordingUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  action: {
    type: String,
    enum: ['forwarded', 'voicemail'],
    required: true
  },
  forwardedTo: { type: String }
});

export default mongoose.model<ICall>('Call', CallSchema);