export default class UserDto {
    id;
    name;
    surname;
    email;
    phone;
    telegramId;
    isActivated;
    roles;
    officeId;

    constructor({ _id, email, phone, name, surname, isActivated, roles, telegramId, officeId }) {
        this.id = _id;
        this.email = email;
        this.name = name;
        this.surname = surname;
        this.phone = phone;
        this.isActivated = isActivated;
        this.roles = roles;
        this.telegramId = telegramId;
        this.officeId = officeId;
    }

    static Convert(userDocument) {
        if (!userDocument) {
            return undefined;
        }

        return new UserDto(userDocument);
    }

    static ConvertMany(userDocuments) {
        return userDocuments.map(UserDto.Convert);
    }
}