import schedulePatternsService from "../services/schedule-patterns-service.js";


class OfficesController {

    async getAllPatternsByUser(req, res, next) {
        try {
            const currentUser = res.getCurrentUser();

            const patterns = await schedulePatternsService.getAllPatternsByUser(currentUser.id);

            return res.json(patterns);
        } catch (e) {
            next(e);
        }
    }

    async getPatternById(req, res, next) {
        try {
            const { id } = req.params;

            const currentUser = res.getCurrentUser();

            const pattern = await schedulePatternsService.getPatternById(currentUser, id);

            return res.json(pattern);
        } catch (e) {
            next(e);
        }
    }

    async createPattern(req, res, next) {
        try {
            const { name, intervals } = req.body;

            const currentUser = res.getCurrentUser();

            const pattern = await schedulePatternsService.createPattern(currentUser.id, name, intervals);

            return res.json(pattern);
        } catch (e) {
            next(e);
        }
    }

    async deletePattern(req, res, next) {
        try {
            const { id } = req.params;

            const currentUser = res.getCurrentUser();

            await schedulePatternsService.deletePatternById(currentUser, id);

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async renamePattern(req, res, next) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const currentUser = res.getCurrentUser();

            return await schedulePatternsService.renamePatternById(currentUser, id, name);
        } catch (e) {
            next(e);
        }
    }
}

export default new OfficesController();