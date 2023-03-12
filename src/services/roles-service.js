import Roles from "../models/role-model.js";
import ApiError from "../exceptions/api-error.js";


class RolesService {
    get() {
        return Object.values(Roles);
    }

    getCurrentUserRolesSafe(currentUser) {
        if (!currentUser) {
            return [];
        }

        return this.getRolesByNames(currentUser.roles);
    }

    getCurrentUserRoles(currentUser) {
        if (!currentUser) {
            throw ApiError.AccessForbidden();
        }

        return this.getRolesByNames(currentUser.roles);
    }

    hasMorePriority(currentUser, otherRoleNames = [Roles.UNREGISTERED.name]) {
        const currentUserRoles = this.getCurrentUserRoles(currentUser);

        if (currentUserRoles.length === 0) {
            throw ApiError.AccessForbidden();
        }

        const otherRoles = this.getRolesByNames(otherRoleNames);

        if (otherRoles.length === 0) {
            return true;
        }

        if (currentUserRoles[0].priority > otherRoles[0].priority) {
           return true;
        }

        throw ApiError.AccessForbidden();
    }

    hasPermission(currentUser, requiredRole = Roles.UNREGISTERED) {
        if (!requiredRole) {
            return true;
        }

        const currentUserRoles = this.getCurrentUserRoles(currentUser);

        if (currentUserRoles.length === 0) {
            throw ApiError.AccessForbidden();
        }

        const highestCurrentUserRole = currentUserRoles[0];

        if (highestCurrentUserRole.priority >= requiredRole.priority) {
            return true;
        }

        throw ApiError.AccessForbidden();
    }

    sortRolesDesc(roles) {
        return (roles).sort((firstRole, secondRole) => secondRole.priority - firstRole.priority)
    }

    getRolesByNames(roleNames) {
        if (!roleNames || roleNames.length === 0) {
            return [];
        }

        const AllRolesArray = Object.values(Roles);

        const roles = [];

        roleNames.forEach(roleName => {
            const role = AllRolesArray.find(({ name }) => name === roleName);

            if (role) {
                roles.push(role)
            }
        })

        return this.sortRolesDesc(roles);
    }
}

export default new RolesService()