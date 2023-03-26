import { Schema, model } from 'mongoose';

const SchedulePatternSchema = new Schema({
    /** название паттерна */
    name: { type: String, required: true },
    /** id пользователя, создавшего шаблон */
    userId: { type: Schema.Types.ObjectId, required: false, Ref: 'User' },
    /** временные интервалы, в течение которых специалист доступен */
    intervals: [{ from: { type: Number }, to: { type: Number } }]
})

export default model('SchedulePattern', SchedulePatternSchema, 'schedule-patterns');