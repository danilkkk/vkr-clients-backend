import { Schema, model } from 'mongoose';
import SchedulePatternModel from "./schedule-pattern-model.js";

const ScheduleSchema = new Schema({
    date: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    patternId: { type: Schema.Types.ObjectId, required: true, ref: 'SchedulePatternModel' },
})

export default model('ScheduleModel', ScheduleSchema, 'schedule');