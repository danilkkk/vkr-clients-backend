import { Schema, model } from 'mongoose';
import UserModel from "./user-model.js";

const SchedulePatternSchema = new Schema({
    /** название паттерна */
    name: { type: String, required: true },
    /** id пользователя, создавшего шаблон */
    userId: { type: Schema.Types.ObjectId, required: false, ref: 'UserModel' },
    /** временные интервалы, в течение которых специалист доступен */
    intervals: [{ from: { type: Number }, to: { type: Number } }]
})

export default model('SchedulePatternModel', SchedulePatternSchema, 'schedule-patterns');