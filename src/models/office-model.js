import { Schema, model } from 'mongoose';

const OfficeSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: String, required: true }
})

export default model('Office', OfficeSchema, 'offices');