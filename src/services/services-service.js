import ApiError from "../exceptions/api-error.js";
import serviceModel from "../models/service-model.js";
import ServiceDto from "../dtos/service-dto.js";
import logger from "../logger.js";

class ServicesService {

    constructor() {
        logger.info('[ServicesService] initialization...');
    }

    async createService(name, info, cost, duration) {
        const serviceDocument = await serviceModel.create({ name, info, cost, duration });

        return ServiceDto.Convert(serviceDocument);
    }

    async deleteServiceById(id) {
        const serviceDocument = await getServiceDocumentById(id);

        await serviceDocument.delete();
    }

    async getAllServices() {
        const serviceDocuments = await serviceModel.find().exec();

        return ServiceDto.ConvertMany(serviceDocuments);
    }

    async getServiceById(id) {
        const serviceDocument = await getServiceDocumentById(id);
        return ServiceDto.Convert(serviceDocument);
    }

    async editServiceById(id, changes) {
        const { name, info, cost, duration } = changes;

        await serviceModel.findByIdAndUpdate(id, { name, info, cost, duration }).exec();

        const newServiceDocument = await getServiceDocumentById(id);

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