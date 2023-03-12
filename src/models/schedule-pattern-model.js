import { Schema, model } from 'mongoose';

const SchedulePatternSchema = new Schema({
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, Ref: 'User' },
    intervals: [{ from: { type: Date }, to: { type: Date } }]
})

export default model('SchedulePattern', SchedulePatternSchema, 'schedule-patterns');