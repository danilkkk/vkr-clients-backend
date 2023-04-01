import scheduleService from "../services/schedule-service.js";

class ScheduleController {

    async createScheduleOnDay(req, res, next) {
        try {
            const { date, patternId } = req.body;

            const userId = req.body.userId ? req.body.userId : res.getCurrentUser().id;

            const schedule = await scheduleService.createScheduleOnDay(userId, date, patternId);

            return res.json(schedule);
        } catch (e) {
            next(e);
        }
    }

    async createScheduleOnDays(req, res, next) {
        try {
            const { dates, patternId } = req.body;

            const currentUser = res.getCurrentUser();

            const schedule = await scheduleService.createScheduleOnDays(currentUser.id, dates, patternId);

            return res.json(schedule);
        } catch (e) {
            next(e);
        }
    }

    async deleteScheduleOnDate(req, res, next) {
        try {
            const { date } = req.params;

            const currentUser = res.getCurrentUser();

            await scheduleService.deleteScheduleOnDate(currentUser.id, date);

            return res.json();
        } catch (e) {
            next(e);
        }
    }

    async changePattern(req, res, next) {
        try {
            const { date, patternId } = req.body;

            const currentUser = res.getCurrentUser();

            return await scheduleService.changePatternOnDay(currentUser.id, date, patternId);
        } catch (e) {
            next(e);
        }
    }

    async getDefaultScheduleForDays(req, res, next) {
        try {
            const { userId } = req.params;
            const { dates } = req.body;

            const schedule = await scheduleService.getScheduleForDays(userId, dates);
            res.json(schedule);
        } catch (e) {
            next(e);
        }
    }
}

export default new ScheduleController();