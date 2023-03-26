import dotenv from 'dotenv';
import officesService from "../services/offices-service.js";

dotenv.config();

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
            const currentUser = res.getCurrentUser();

            const { name, email, phone, address } = req.body;

            const user = await officesService.createOffice(currentUser, name, address, phone, email);

            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async deleteOffice(req, res, next) {
        try {
            const { id } = req.params;
            const currentUser = res.getCurrentUser();

            await officesService.deleteOfficeById(currentUser, id);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async editOffice(req, res, next) {
        try {
            const { id } = req.params;
            const changes = req.body;
            const currentUser = res.getCurrentUser();
            return await officesService.editOfficeById(currentUser, id, changes);
        } catch (e) {
            next(e);
        }
    }
}

export default new OfficesController();