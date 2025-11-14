import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' }],
    scheduledAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
