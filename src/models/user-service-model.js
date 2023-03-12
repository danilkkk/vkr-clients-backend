import { Schema, model } from 'mongoose';

const UserServiceSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, Ref: 'User' },
    officeId: { type: Schema.Types.ObjectId, required: true, Ref: 'Office' },
})

export default model('UserService', UserServiceSchema, 'user-service');