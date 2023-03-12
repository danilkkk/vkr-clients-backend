import ApiError from "../exceptions/api-error.js";
import tokenService from "../services/token-service.js";

export default function createRoleMiddleware(...roles) {
    return (req, res, next) => {
        try {
            const authorizationHeader = req.headers.authorization;

            if (!authorizationHeader) {
                return next(ApiError.UnauthorizedError())
            }

            const accessToken = authorizationHeader.split(' ')[1];

            if (!accessToken) {
                return next(ApiError.UnauthorizedError())
            }

            const userData = tokenService.validateAccessToken(accessToken);

            if (!userData) {
                return next(ApiError.UnauthorizedError())
            }

            if (!roles || roles.length === 0) {
                next();
            }

            let hasRole = false;

            const userRoles = userData.roles;

            (userRoles).forEach(roleName => {
                if (roles.find(role => role.name === roleName)) {
                    hasRole = true;
                }
            })

            if (!hasRole) {
                return next(ApiError.AccessForbidden());
            }

            res.locals.currentUser = userData;

            next();
        } catch (e) {
            return next(ApiError.UnauthorizedError())
        }
    }
}