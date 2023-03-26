export default class ServiceDto {
    id;
    name;
    info;
    cost;
    duration;

    constructor({ _id, name, info, cost, duration }) {
        this.id = _id;
        this.info = info;
        this.name = name;
        this.cost = cost;
        this.duration = duration;
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