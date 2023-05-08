import { Schema, model } from 'mongoose';
import SchedulePatternModel from "./schedule-pattern-model.js";
import UserModel from "./user-model.js";
import OfficeModel from "./office-model.js";

const ScheduleSchema = new Schema({
    date: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'UserModel' },
    patternId: { type: Schema.Types.ObjectId, required: true, ref: 'SchedulePatternModel' },
    officeId: { type: Schema.Types.ObjectId, required: false, ref: 'OfficeModel' },
})

export default model('ScheduleModel', ScheduleSchema, 'schedule');