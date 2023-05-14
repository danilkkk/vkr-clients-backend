import OfficeDto from "./office-dto.js";

export default class ServiceDto {
    id;
    name;
    info;
    cost;
    duration;
    office;
    active;

    constructor({ _id, name, info, cost, duration, office, active }) {
        this.id = _id;
        this.info = info;
        this.name = name;
        this.cost = cost;
        this.duration = duration;
        this.active = active;

        if (office) {
            this.office = OfficeDto.Convert(office);
        }
    }

    static Convert(serviceDocument) {
        if (!serviceDocument) {
            return undefined;
        }

        return new ServiceDto(serviceDocument);
    }

    static ConvertMany(serviceDocuments) {
        return serviceDocuments.map(ServiceDto.Convert);
    }
}