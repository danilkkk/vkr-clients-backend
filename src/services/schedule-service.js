import ApiError from "../exceptions/api-error.js";
import scheduleModel from "../models/schedule-model.js";
import ScheduleDto from "../dtos/schedule-dto.js";
import ScheduleModel from "../models/schedule-model.js";
import RecordModel from "../models/record-model.js";
import {ObjectId} from "mongodb";
import {dateToString, getDateStringsFromInterval, stringToMillis} from "../utils/time-utils.js";

class ScheduleService {

    async getPopulatedScheduleDocumentById(scheduleId) {
        return await ScheduleModel.findById(scheduleId)
            .populate('patternId')
            .populate('userId')
            .exec();
    }

    async createScheduleOnDay(userId, date, patternId) {
        if (date < Date.now()) {
            throw ApiError.BadRequest("Date in the past");
        }

        const candidate = await getUserScheduleDocumentByDateSafe(userId, date);

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

        const schedule = await scheduleModel.find({ userId, date: { $in: datesAsStr }})
            .populate('patternId')
            .populate('userId')
            .exec();

        return ScheduleDto.ConvertMany(schedule);
    }

    async getScheduleForPeriod(userId, from, to) {
        const dates = getDateStringsFromInterval(from, to);
        console.log(dates);
        return await this.getScheduleForDays(userId, dates);
    }

    async getFreeTimeForPeriod(userId, from, to, serviceDuration) {
        const fromStr = dateToString(from);
        const toStr = dateToString(to);

        const pipeline = [
            {
                '$addFields': {
                    'stringToDate': {
                        '$toDate': '$date'
                    }
                }
            },
            {
                '$addFields': {
                    'convertedDate': {
                        '$toLong': '$stringToDate'
                    }
                }
            },
            {
                '$match': {
                    'userId': new ObjectId(userId),
                    'convertedDate': {
                        '$gte': stringToMillis(fromStr),
                        '$lte': stringToMillis(toStr)
                    }
                }
            },
            {
                    $lookup: {
                        from: 'schedule-patterns',
                        localField: 'patternId',
                        foreignField: '_id',
                        as: 'pattern'
                    }
                }
        ]

        const schedulesOnPeriod = await ScheduleModel.aggregate(pipeline).exec();

        if (schedulesOnPeriod.length === 0) {
            return []
        }

        const scheduleIds = schedulesOnPeriod.map(s => s._id);

        const records = await RecordModel.find({ scheduleId: { $in: scheduleIds } }).populate('scheduleId').exec();

        return schedulesOnPeriod.map(scheduleOnDay => {
            const recordsOnDay = records.filter(record => record.scheduleId.date === scheduleOnDay.date);

            return {
                id: scheduleOnDay._id,
                date: scheduleOnDay.date,
                freeIntervals: serviceDuration ? getAvailableTime(scheduleOnDay.pattern[0].intervals, recordsOnDay, serviceDuration) : getFreeIntervals(scheduleOnDay.pattern[0].intervals, recordsOnDay)
            }
        }).filter(date => date.freeIntervals.length);
    }

    isTheRecordFit(intervals, otherRecords, startTime, duration, endTime = startTime + duration) {
        const freeIntervals = getFreeIntervals(intervals, otherRecords);

        return !!freeIntervals.find(interval => interval.from <= startTime && interval.to >= endTime);
    }

    isEditedTheRecordFit(intervals, otherRecords, startTime, duration, currentRecordId) {
        return this.isTheRecordFit(intervals, otherRecords.slice().filter(record => record._id !== currentRecordId), startTime, duration);
    }
}

function getAvailableTime(intervals, records, duration) {
    return getFreeIntervals(intervals, records)
        .filter(interval => interval.duration >= duration);
}

function getFreeIntervals(intervals, records) {
    if (records.length === 0) {
        return intervals.map(interval => ({
            from: interval.from,
            to: interval.to,
            duration: interval.to - interval.from,
        }));
    }

    console.log(records);
    // преобразуем и сортируем массив записей по возрастанию
    records = records.map(r => ({
        from: r.startTime,
        to: r.startTime + r.duration,
    })).sort((r1, r2) => r1.from - r2.from);

    console.log(records);

    const freeIntervals = [];

    let from;
    let to;
    let duration;

    for (let i = 0; i < intervals.length; i++) {
        const recordsInCurrentInterval = getRecordsInCurrentInterval(intervals[i], records);

        from = intervals[i].from;

        for (let j = 0; j < recordsInCurrentInterval.length; j++) {
            to = recordsInCurrentInterval[j].from;

            duration = to - from;

            if (duration > 0) {
                freeIntervals.push({
                    from,
                    to,
                    duration
                })
            }

            from = recordsInCurrentInterval[j].to;
        }

        to = intervals[i].to;
        duration = to - from;

        if (duration > 0) {
            freeIntervals.push({
                from,
                to,
                duration
            })
        }
    }

    return freeIntervals;
}

function getRecordsInCurrentInterval(interval, records) {
    return records.filter(record => record.from >= interval.from && record.to <= interval.to);
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

async function getPopulatedUserSchedule(userId, date) {
    const dateStr = dateToString(date);
    const schedule = await scheduleModel.findOne({ date: dateStr, userId }).populate('patternId').populate('userId').exec();
    return schedule;
}

export default new ScheduleService()