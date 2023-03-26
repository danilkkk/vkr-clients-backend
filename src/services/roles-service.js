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

    getMaxPriorityRole(user) {
        return this.getCurrentUserRoles(user)
            .sort((r1, r2) => r1.priority - r2.priority)
            .pop();
    }

    getCurrentUserRoles(currentUser) {
        if (!currentUser) {
            throw ApiError.AccessForbidden();
        }

        return this.getRolesByNames(currentUser.roles);
    }

    checkIfHasMorePriority(currentUser, otherUserRoleNames = [Roles.UNREGISTERED.name], minRole) {
        const currentUserRoles = this.getCurrentUserRoles(currentUser);

        if (currentUserRoles.length === 0) {
            throw ApiError.AccessForbidden();
        }

        if (minRole && currentUserRoles[0].priority < minRole.priority) {
            throw ApiError.AccessForbidden();
        }

        const otherRoles = this.getRolesByNames(otherUserRoleNames);

        if (otherRoles.length === 0) {
            return true;
        }

        if (currentUserRoles[0].priority > otherRoles[0].priority) {
           return true;
        }

        throw ApiError.AccessForbidden();
    }

    // checkIfHasMorePriorityOrItIsTheSameUser(currentUser, otherUser) {
    //     if (!otherUser) {
    //         return true;
    //     }
    //
    //     if (currentUser && currentUser.id === otherUser.id) {
    //         return true;
    //     }
    //
    //     return this.checkIfHasMorePriority(currentUser, otherUser.roles)
    // }

    checkPermission(currentUser, requiredRole = Roles.UNREGISTERED) {
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