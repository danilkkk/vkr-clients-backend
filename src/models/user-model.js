import { Schema, model } from 'mongoose';

import OfficeModel from "./office-model.js";

const UserSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true, required: false },
    password: { type: String, required: false },
    isActivated: { type: Boolean, default: false },
    activationLink: { type: String },
    resetPasswordLink: { type: String, required: false },
    officeId: { type: Schema.Types.ObjectId, required: false, ref: 'OfficeModel' },
    roles: [{ type: String }],
})

export default model('UserModel', UserSchema, 'users');