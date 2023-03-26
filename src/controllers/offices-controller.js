import officesService from "../services/offices-service.js";

class OfficesController {

    async getAllOffices(req, res, next) {
        try {
            const offices = await officesService.getAllOffices();

            return res.json(offices);
        } catch (e) {
            next(e);
        }
    }

    async getOfficeById(req, res, next) {
        try {
            const { id } = req.params;

            const office = await officesService.getOfficeById(id);

            return res.json(office);
        } catch (e) {
            next(e);
        }
    }

    async createOffice(req, res, next) {
        try {
            const { name, email, phone, address } = req.body;

            const office = await officesService.createOffice(name, address, phone, email);

            return res.json(office);
        } catch (e) {
            next(e);
        }
    }

    async deleteOffice(req, res, next) {
        try {
            const { id } = req.params;

            await officesService.deleteOfficeById(id);

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async editOffice(req, res, next) {
        try {
            const { id } = req.params;
            const changes = req.body;

            return await officesService.editOfficeById(id, changes);
        } catch (e) {
            next(e);
        }
    }
}

export default new OfficesController();