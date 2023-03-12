import { Schema, model } from 'mongoose';

const ServiceSchema = new Schema({
    name: { type: String, required: true },
    info: { type: String, required: false },
    cost: { type: Number, required: false },
    duration: { type: Number, required: false }, // ms
})

export default model('Service', ServiceSchema, 'services');