import { Schema, model } from 'mongoose';
import OfficeModel from "./office-model.js";
import UserModel from "./user-model.js";
import ServiceModel from "./service-model.js";
import ScheduleModel from "./schedule-model.js";

const ChatBotModel = new Schema({
    chatId: { type: Number, required: true },
    officeId: {  type: Schema.Types.ObjectId, required: false, ref: 'OfficeModel' },
    serviceId: { type: Schema.Types.ObjectId, required: false, ref: 'ServiceModel' },
    specId: { type: Schema.Types.ObjectId, required: false, ref: 'UserModel' },
    scheduleId: { type: Schema.Types.ObjectId, required: false, ref: 'ScheduleModel' }
})

export default model('ChatBotModel', ChatBotModel, 'chat-bot');