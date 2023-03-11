import Roles from "../models/role-model.js";


class RolesService {
    get() {
        return Roles;
    }


}

export default new RolesService()