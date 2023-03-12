import { Schema, model } from 'mongoose';

const ScheduleSchema = new Schema({
    date: { type: Date, required: true, default: new Date() },
    intervals: [{ from: { type: Date }, to: { type: Date } }],
    userId: { type: Schema.Types.ObjectId, required: true, Ref: 'User' },
    officeId: { type: Schema.Types.ObjectId, required: true, Ref: 'Office' },
})

export default model('Schedule', ScheduleSchema, 'schedule');