import { Schema, model } from 'mongoose';

import UserModel from "./user-model.js";

const TokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'UserModel' },
    refreshToken: { type: String, required: true },
})

export default model('TokenModel', TokenSchema, 'tokens');