import dotenv from 'dotenv';
import rolesService from "../services/roles-service.js";
dotenv.config();

class RolesController {

    get(_, res) {
        const roles = rolesService.get();
        res.json(roles);
    }
}

export default new RolesController();