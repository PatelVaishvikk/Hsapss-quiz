import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, default: 0 },
  answers: [
    {
      questionIndex: Number,
      answer: Number,
      correct: Boolean,
      timeSpent: Number,
    },
  ],
});

const GameSessionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  gamePin: { type: String, required: true, unique: true },
  hostId: { type: String },
  players: [PlayerSchema],
  currentQuestion: { type: Number, default: 0 },
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
}, { timestamps: true });

export default mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);
