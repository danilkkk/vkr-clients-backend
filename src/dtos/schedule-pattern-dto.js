export default class SchedulePatternDto {
    id;
    name;
    userId;
    intervals;

    constructor({ _id, name, userId, intervals }) {
        this.id = _id;
        this.intervals = intervals;
        this.name = name;
        this.userId = userId;
    }

    static Convert(patternDocument) {
        if (!patternDocument) {
            return undefined;
        }

        return new SchedulePatternDto(patternDocument);
    }

    static ConvertMany(patternDocuments) {
        return patternDocuments.map(SchedulePatternDto.Convert);
    }
}