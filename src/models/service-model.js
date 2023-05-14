import { Schema, model } from 'mongoose';

const ServiceSchema = new Schema({
    name: { type: String, required: true },
    info: { type: String, required: false },
    cost: { type: Number, required: false },
    duration: { type: Number, required: false }, // ms
})

ServiceSchema.pre('findOneAndDelete', function (next) {
    const id = this.getQuery()["_id"];
    model("ServiceOfficeModel").deleteMany({'serviceId': id}, function (err, result) {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
    model("ServiceSpecialistModel").deleteMany({'serviceId': id}, function (err, result) {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
});

export default model('ServiceModel', ServiceSchema, 'services');