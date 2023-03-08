export default class UserDto {
    id;
    email;
    isActivated;

    constructor({ _id, email, isActivated }) {
        this.email = email;
        this.id = _id;
        this.isActivated = isActivated;
    }

    static Convert(userDocument) {
        return new UserDto(userDocument);
    }

    static ConvertMany(userDocuments) {
        return userDocuments.map(UserDto.Convert);
    }
}