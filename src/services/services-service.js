import ApiError from "../exceptions/api-error.js";
import serviceModel from "../models/service-model.js";
import ServiceDto from "../dtos/service-dto.js";
import logger from "../logger.js";
import serviceOfficeModel from "../models/service-office-model.js";
import ServiceSpecialistModel from "../models/service-specialist-model.js";
import UsersService from "./users-service.js";
import ServiceOfficeModel from "../models/service-office-model.js";
import serviceSpecialistModel from "../models/service-specialist-model.js";

class ServicesService {

    constructor() {
        logger.info('[ServicesService] initialization...');
    }

    async createService(name, info, cost, duration, officeId) {
        const serviceDocument = await serviceModel.create({ name, info, cost, duration });
        await ServiceOfficeModel.create({ officeId, serviceId: serviceDocument._id });

        return ServiceDto.Convert(serviceDocument);
    }

    async deleteServiceById(id) {
        await serviceModel.findByIdAndDelete(id);
    }

    async startExecuteService(serviceId, userId) {
        await serviceSpecialistModel.create({ serviceId, userId });
    }

    async stopExecuteService(serviceId, userId) {
        const document = await serviceSpecialistModel.findOne({ serviceId, userId });

        if (document) {
            await document.delete();
        }
    }

    async getAllServices(specId) {
        const serviceDocuments = await serviceModel.find().exec();
        const serviceOffices = await serviceOfficeModel.find().populate('officeId').exec();
        const serviceSpecialist = await ServiceSpecialistModel.find({ userId: specId });
        const specialist = await UsersService.getSpecById(specId);

        const servicesWithOffices = serviceDocuments.map(service => {

            const office = serviceOffices.find(doc => String(doc.serviceId) === String(service._id))

            return {
                ...service._doc,
                active: !!serviceSpecialist.find(doc => String(doc.serviceId) === String(service._id)),
                office: office ? office.officeId : null,
            }
        });

        return {
            specialist,
            services:  ServiceDto.ConvertMany(servicesWithOffices),
        }
    }

    async getServiceById(id) {
        const serviceDocument = await getServiceDocumentById(id);
        return ServiceDto.Convert(serviceDocument);
    }

    async editServiceById(serviceId, changes) {
        const { name, info, cost, duration, officeId } = changes;

        await serviceModel.findByIdAndUpdate(serviceId, { name, info, cost, duration }).exec();

        const document = await ServiceOfficeModel.findOne({ serviceId }).exec();

        if (document) {
            document.officeId = officeId;
            await document.save();
        } else {
            await ServiceOfficeModel.create({ serviceId, officeId });
        }

        const newServiceDocument = await getServiceDocumentById(serviceId);

        return ServiceDto.Convert(newServiceDocument);
    }
}

async function getServiceDocumentById(id) {
    const serviceDocument = await getServiceDocumentByIdSafe(id);

    if (!serviceDocument) {
        throw ApiError.NotFound(`Service with id ${id} does not exist`);
    }

    return serviceDocument;
}

async function getServiceDocumentByIdSafe(id) {
    return await serviceModel.findById(id).exec();
}

export default new ServicesService()