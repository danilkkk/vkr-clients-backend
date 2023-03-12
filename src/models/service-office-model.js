import { Schema, model } from 'mongoose';

const ServiceOfficeSchema = new Schema({
    serviceId: { type: Schema.Types.ObjectId, required: true, Ref: 'Service' },
    officeId: { type: Schema.Types.ObjectId, required: true, Ref: 'Office' },
})

export default model('ServiceOffice', ServiceOfficeSchema, 'service-office');