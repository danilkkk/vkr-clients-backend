import ApiError from "../exceptions/api-error.js";
import schedulePatternModel from "../models/schedule-pattern-model.js";
import SchedulePatternDto from "../dtos/schedule-pattern-dto.js";
import logger from "../logger.js";
import usersService from "./users-service.js";

class SchedulePatternsService {
    constructor() {
        logger.info('[SchedulePatternsService] initialization...');
    }

    checkIfTheSameUser(currentUser, userId) {
        if (!currentUser || currentUser.id !== userId) {
            throw ApiError.AccessForbidden();
        }
    }

    async createPattern(userId, name, intervals) {
        name = name ?? `Шаблон от ${(new Date(Date.now())).toLocaleString()}`;

        if (!validateIntervals(intervals)) {
            ApiError.BadRequest();
        }

        const patternDocument = await schedulePatternModel.create({ name, userId, intervals });

        return SchedulePatternDto.Convert(patternDocument);
    }

    async deletePatternById(currentUser, id) {
        const patternDocument = await getPatternDocumentById(id);

        this.checkIfTheSameUser(currentUser, patternDocument.userId);

        // TODO удалять паттерн, если он нигде не используется

        patternDocument.userId = undefined;
        await patternDocument.save();
    }

    async getAllPatternsByUser(userId) {
        const patternDocuments = await schedulePatternModel.find({ userId }).exec();

        return SchedulePatternDto.ConvertMany(patternDocuments);
    }

    async getPatternById(currentUser, id) {
        const patternDocument = await getPatternDocumentById(id);

        this.checkIfTheSameUser(currentUser, patternDocument.userId);

        return SchedulePatternDto.Convert(patternDocument);
    }

    async renamePatternById(currentUser, id, name) {
        const patternDocument = await getPatternDocumentById(id);

        this.checkIfTheSameUser(currentUser, patternDocument.userId);

        patternDocument.name = name;
        await patternDocument.save();

        return SchedulePatternDto.Convert(patternDocument);
    }
}

function validateIntervals(intervals) {
    if (!intervals || !Array.isArray(intervals) || intervals.length === 0) {
        return false;
    }

    return !intervals.find(interval => !interval.from || !interval.to || interval.from >= interval.to);
}

async function getPatternDocumentById(id) {
    const patternDocument = await getPatternDocumentByIdSafe(id);

    if (!patternDocument) {
        throw ApiError.NotFound(`Schedule pattern with id ${id} does not exist`);
    }

    return patternDocument;
}

async function getPatternDocumentByIdSafe(id) {
    return await schedulePatternModel.findById(id).exec();
}

export default new SchedulePatternsService()