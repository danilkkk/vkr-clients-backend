import { Schema, model } from 'mongoose';
import UserModel from "./user-model.js";
import ScheduleModel from "./schedule-model.js";
import ServiceModel from "./service-model.js";

const RecordSchema = new Schema({
    /** идентификатор клиента */
    clientId: { type: Schema.Types.ObjectId, required: true, ref: 'UserModel' },
    /** идентификатор специалиста */
    specId: { type: Schema.Types.ObjectId, required: true, ref: 'UserModel' },
    /** идентификатор услуги */
    serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'ServiceModel' },
    /** идентификатор расписания на день записи */
    scheduleId: { type: Schema.Types.ObjectId, required: true, ref: 'ScheduleModel' },
    /** цена услуги (записывается отдельно, так как услуга может быть отредактирована) */
    cost: { type: Number, required: true },
    /** длительность услуги (записывается отдельно, так как услуга может быть отредактирована) */
    duration: { type: Number, required: true },
    /** время начала сеанса */
    startTime: { type: Number, required: true },
    /** оплачена ли услуга */
    paid: { type: Boolean, required: false },
})

export default model('RecordModel', RecordSchema, 'records');