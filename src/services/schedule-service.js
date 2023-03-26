import ApiError from "../exceptions/api-error.js";
import scheduleModel from "../models/schedule-model.js";
import moment from "moment";
import ScheduleDto from "../dtos/schedule-dto.js";

class ScheduleService {

    async createScheduleOnDay(userId, date, patternId) {
        if (date < Date.now()) {
            throw ApiError.BadRequest("Date in the past");
        }

        const candidate = await getUserScheduleDocumentByDateSafe(userId, date);

        console.log(candidate);

        if (candidate) {
            throw ApiError.BadRequest("schedule on this date is already exist. Try to edit it");
        }

        const dateStr = dateToString(date);

        await scheduleModel.create({ userId, date: dateStr, patternId });

        return ScheduleDto.Convert(await getPopulatedUserSchedule(userId, date));
    }

    async createScheduleOnDays(userId, dates, patternId) {
        return await Promise.all(dates.map(date => this.createScheduleOnDay(userId, date, patternId)));
    }

    async deleteScheduleOnDate(userId, day) {
        const schedule = await getUserScheduleDocumentByDate(userId, day);

        await schedule.delete();
    }

    async changePatternOnDay(userId, date, patternId) {
        const schedule = await getUserScheduleDocumentByDate(userId, date);

        schedule.patternId = patternId;
        await schedule.save();

        return ScheduleDto.Convert(await getPopulatedUserSchedule(userId, date));
    }

    async getScheduleForDays(userId, dates) {
        const datesAsStr = dates.map(dateToString);

        console.log(datesAsStr);

        console.log(userId);

        const schedule = await scheduleModel.find({ userId, date: { $in: datesAsStr }}).populate('patternId').populate('userId').exec();

        return ScheduleDto.ConvertMany(schedule);
    }
}

async function getUserScheduleDocumentByDate(userId, date) {
    const patternDocument = await getUserScheduleDocumentByDateSafe(userId, date);

    if (!patternDocument) {
        throw ApiError.NotFound(`Schedule on date ${dateToString(date)} does not exist`);
    }

    return patternDocument;
}

async function getUserScheduleDocumentByDateSafe(userId, date) {
    const dateStr = dateToString(date);
    return await scheduleModel.findOne({ date: dateStr, userId }).exec();
}

function dateToString(date) {
    return moment(date).format('YYYY-MM-DD');
}

async function getPopulatedUserSchedule(userId, date) {
    const dateStr = dateToString(date);
    const schedule = await scheduleModel.findOne({ date: dateStr, userId }).populate('patternId').populate('userId').exec();
    return schedule;
}


function stringToDate(dateString) {
    return Date.parse(dateString);
}

export default new ScheduleService()