import { Schema, model } from 'mongoose';
import ServiceModel from "./service-model.js";
import UserModel from "./user-model.js";

const ServiceOfficeSchema = new Schema({
    serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'ServiceModel' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'UserModel' },
})

export default model('ServiceSpecialistModel', ServiceOfficeSchema, 'service-specialist');