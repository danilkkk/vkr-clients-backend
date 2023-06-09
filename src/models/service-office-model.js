import { Schema, model } from 'mongoose';
import ServiceModel from "./service-model.js";
import OfficeModel from './office-model.js'

const ServiceOfficeSchema = new Schema({
    serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'ServiceModel' },
    officeId: { type: Schema.Types.ObjectId, required: true, ref: 'OfficeModel' },
})

export default model('ServiceOfficeModel', ServiceOfficeSchema, 'service-office');