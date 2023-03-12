import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true, required: false },
    password: { type: String, required: true },
    isActivated: { type: Boolean, default: false },
    activationLink: { type: String },
    resetPasswordLink: { type: String, required: false },
    roles: [{ type: String }],
})

export default model('User', UserSchema, 'users');