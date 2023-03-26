export default class SpecialistDto {
    id;
    name;
    surname;

    constructor({ _id, name, surname }) {
        this.id = _id;
        this.name = name;
        this.surname = surname;
    }

    static Convert(userDocument) {
        if (!userDocument) {
            return undefined;
        }

        return new SpecialistDto(userDocument);
    }

    static ConvertMany(userDocuments) {
        return userDocuments.map(SpecialistDto.Convert);
    }
}