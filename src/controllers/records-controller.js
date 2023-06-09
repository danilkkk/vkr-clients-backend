import recordsService from "../services/records-service.js";

class RecordController {

    async createRecord(req, res, next) {
        try {
            const { serviceId, scheduleId, time } = req.body;

            const userId = req.body.userId ? req.body.userId : res.getCurrentUser().id;

            const schedule = await recordsService.createRecord(userId, serviceId, scheduleId, time);

            return res.json(schedule);
        } catch (e) {
            next(e);
        }
    }

    async editRecordById(req, res, next) {
        try {
            const { recordId } = req.params;

            const currentUser = res.getCurrentUser();

            const clientId = req.body.clientId ? req.body.clientId : currentUser.id;

            const record = await recordsService.editRecordById(currentUser, clientId, recordId, req.body)

            return res.json(record);
        } catch (e) {
            next(e);
        }
    }

    async getProfitForPeriod(req, res, next) {
        try {
            const { from, to } = req.body;

            const currentUser = res.getCurrentUser();

            const userId = req.body.userId ? req.body.userId : currentUser.id;

            const record = await recordsService.getProfitForPeriod(currentUser, userId, from, to)

            return res.json(record);
        } catch (e) {
            next(e);
        }
    }

    async setPaidStatus(req, res, next) {
        try {
            const { recordId } = req.body;

            const currentUser = res.getCurrentUser();

            await recordsService.setPaidStatus(currentUser, recordId)

            return res.send();
        } catch (e) {
            next(e);
        }
    }

    async getClientRecords(req, res, next) {
        try {
            const currentUser = res.getCurrentUser();

            const clientId = req.query.clientId ? req.query.clientId : currentUser.id;

            const records = await recordsService.getClientRecords(currentUser, clientId)

            return res.json(records);
        } catch (e) {
            next(e);
        }
    }

    async getRecordsBySpec(req, res, next) {
        try {
            const currentUser = res.getCurrentUser();

            const records = await recordsService.getRecordsBySpec(currentUser, req.query.specId)

            return res.json(records);
        } catch (e) {
            next(e);
        }
    }

    async deleteRecordById(req, res, next) {
        try {
            const { recordId } = req.params;

            const currentUser = res.getCurrentUser();

            const record = await recordsService.deleteRecordById(currentUser, recordId)

            return res.json(record);
        } catch (e) {
            next(e);
        }
    }

    async getAvailableDaysForService(req, res, next) {
        try {
            const { serviceId, from, to } = req.query;
            const { specId } = req.params;

            const schedule = await recordsService.getAvailableDaysForService(specId, serviceId, from, to);

            return res.json(schedule);
        } catch (e) {
            next(e);
        }
    }
}

export default new RecordController();