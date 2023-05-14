import dotenv from 'dotenv';
import servicesService from "../services/services-service.js";
import usersService from "../services/users-service.js";

dotenv.config();

class ServicesController {

    async getAllServices(req, res, next) {
        try {

            const services = await servicesService.getAllServices(req.query.specId);
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

    async getSpecialistsByService(req, res, next) {
        try {
            const { id } = req.params;

            const specialists = await usersService.getSpecialistsByService(id);

            return res.json(specialists);
        } catch (e) {
            next(e);
        }
    }

    async createService(req, res, next) {
        try {
            const { name, info, cost, duration, officeId } = req.body;

            const service = await servicesService.createService(name, info, cost, duration, officeId);

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

    async startExecute(req, res, next) {
        try {
            const { id } = req.params;
            const { specId } = req.body;

            await servicesService.startExecuteService(id, specId);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async stopExecute(req, res, next) {
        try {
            const { id } = req.params;
            const { specId } = req.body;

            await servicesService.stopExecuteService(id, specId);
            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async editService(req, res, next) {
        try {
            const { id } = req.params;
            const changes = req.body;
            return res.json(await servicesService.editServiceById(id, changes));
        } catch (e) {
            next(e);
        }
    }
}

export default new ServicesController();