import SchedulePatternDto from "./schedule-pattern-dto.js";
import SpecialistDto from "./specialist-dto.js";

export default class ScheduleDto {
    id;
    date;
    specialist;
    intervals;

    constructor({ _id, date, userId, patternId }) {
        this.id = _id;
        this.date = date;
        const pattern = new SchedulePatternDto(patternId);
        this.intervals = pattern.intervals;
        this.specialist = new SpecialistDto(userId);
    }

    static Convert(patternDocument) {
        if (!patternDocument) {
            return undefined;
        }

        return new ScheduleDto(patternDocument);
    }

    static ConvertMany(patternDocuments) {
        return patternDocuments.map(ScheduleDto.Convert);
    }
}