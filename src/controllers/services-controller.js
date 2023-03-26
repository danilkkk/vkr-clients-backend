import dotenv from 'dotenv';
import servicesService from "../services/services-service.js";

dotenv.config();

class ServicesController {

    async getAllServices(req, res, next) {
        try {
            const services = await servicesService.getAllServices();
            return res.json(services);
        } catch (e) {
            next(e);
        }
    }

    async getServiceById(req, res, next) {
        try {
            const { id } = req.params;

            const service = await servicesService.getServiceById(id);

            return res.json(service);
        } catch (e) {
            next(e);
        }
    }

    async createService(req, res, next) {
        try {
            const { name, info, cost, duration } = req.body;

            const service = await servicesService.createService(name, info, cost, duration);

            return res.json(service);
        } catch (e) {
            next(e);
        }
    }

    async deleteService(req, res, next) {
        try {
            const { id } = req.params;

            await servicesService.deleteServiceById(id);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async editService(req, res, next) {
        try {
            const { id } = req.params;
            const changes = req.body;
            return await servicesService.editServiceById(id, changes);
        } catch (e) {
            next(e);
        }
    }
}

export default new ServicesController();