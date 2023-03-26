export default class UserDto {
    id;
    name;
    surname;
    email;
    phone;
    isActivated;
    roles;

    // TODO добавить офис (через populate)
    constructor({ _id, email, phone, name, surname, isActivated, roles }) {
        this.id = _id;
        this.email = email;
        this.name = name;
        this.surname = surname;
        this.phone = phone;
        this.isActivated = isActivated;
        this.roles = roles;
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