export default class UserDto {
    id;
    email;
    isActivated;
    roles;

    constructor({ _id, email, isActivated, roles }) {
        this.email = email;
        this.id = _id;
        this.isActivated = isActivated;
        this.roles = roles;
    }

    static Convert(userDocument) {
        return new UserDto(userDocument);
    }

    static ConvertMany(userDocuments) {
        return userDocuments.map(UserDto.Convert);
    }
}