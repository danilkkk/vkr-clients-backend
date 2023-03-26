import ApiError from "../exceptions/api-error.js";
import OfficeModel from "../models/office-model.js";
import OfficeDto from "../dtos/office-dto.js";

class OfficesService {

    async createOffice(name, address, phone, email) {
        const officeDocument = await OfficeModel.create({ name, address, phone, email });

        return OfficeDto.Convert(officeDocument);
    }

    async deleteOfficeById(id) {
        const officeDocument = await getOfficeDocumentById(id);

        await officeDocument.delete();
    }

    async getAllOffices() {
        const officeDocuments = await OfficeModel.find().exec();

        return OfficeDto.ConvertMany(officeDocuments);
    }

    async getOfficeById(id) {
        const officeDocument = await getOfficeDocumentById(id);
        return OfficeDto.Convert(officeDocument);
    }

    async editOfficeById(id, changes) {
        const { name, email, phone, address } = changes;

        await OfficeModel.findByIdAndUpdate(id, { name, email, phone, address }).exec();

        const newOfficeDocument = await getOfficeDocumentById(id);

        return OfficeDto.Convert(newOfficeDocument);
    }
}

async function getOfficeDocumentById(id) {
    const officeDocument = await getOfficeDocumentByIdSafe(id);

    if (!officeDocument) {
        throw ApiError.NotFound(`Office with id ${id} does not exist`);
    }

    return officeDocument;
}

async function getOfficeDocumentByIdSafe(id) {
    return await OfficeModel.findById(id).exec();
}

export default new OfficesService()