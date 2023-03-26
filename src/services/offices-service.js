import ApiError from "../exceptions/api-error.js";
import Roles from "../models/role-model.js";
import rolesService from "./roles-service.js";
import OfficeModel from "../models/office-model.js";
import OfficeDto from "../dtos/office-dto.js";

class OfficesService {

    async createOffice(currentUser, name, address, phone, email) {
        rolesService.checkPermission(currentUser, Roles.SUPERUSER);

        const officeDocument = await OfficeModel.create({ name, address, phone, email });

        return OfficeDto.Convert(officeDocument);
    }

    async deleteOfficeById(currentUser, id) {
        rolesService.checkPermission(currentUser, Roles.SUPERUSER);

        const officeDocument = await getOfficeDocumentById(id);

        await officeDocument.delete();
    }

    async getAllOffices() {
        const officeDocuments = await officeModel.find().exec();

        return OfficeDto.ConvertMany(officeDocuments);
    }

    async getOfficeById(id) {
        const officeDocument = await getOfficeDocumentById(id);
        return OfficeDto.Convert(officeDocument);
    }

    async editOfficeById(currentUser, id, changes) {
        rolesService.checkPermission(currentUser, Roles.ADMINISTRATOR);

        const { name, email, phone, address } = changes;

        await officeModel.findByIdAndUpdate(id, { name, email, phone, address }).exec();

        const newOfficeDocument = await getOfficeDocumentById(id);

        return OfficeDto.Convert(newOfficeDocument);
    }
}

async function getOfficeDocumentById(id) {
    const userDocument = await getOfficeDocumentByIdSafe(id);

    if (!userDocument) {
        throw ApiError.NotFound(`Office with id ${id} does not exist`);
    }

    return userDocument;
}

async function getOfficeDocumentByIdSafe(id) {
    return await officeModel.findById(id).exec();
}

export default new OfficesService()