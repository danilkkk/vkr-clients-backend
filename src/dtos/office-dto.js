export default class OfficeDto {
    id;
    name;
    email;
    phone;
    address;

    constructor({ _id, email, phone, name, address }) {
        this.id = _id;
        this.email = email;
        this.name = name;
        this.address = address;
        this.phone = phone;
    }

    static Convert(officeDocument) {
        if (!officeDocument) {
            return undefined;
        }

        return new OfficeDto(officeDocument);
    }

    static ConvertMany(officeDocuments) {
        return officeDocuments.map(OfficeDto.Convert);
    }
}