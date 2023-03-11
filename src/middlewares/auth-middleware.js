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

            console.log(userData);

            if (!userData) {
                return next(ApiError.UnauthorizedError())
            }

            let hasRole = false;

            const userRoles = userData.roles;

            (userRoles).forEach(role => {
                if (roles.includes(role)) {
                    hasRole = true;
                }
            })

            if (!hasRole) {
                return next(ApiError.UnauthorizedError());
            }

            req.user = userData;

            next();

        } catch (e) {
            return next(ApiError.UnauthorizedError())
        }
    }
}
//
// export default function (req, res, next) {
//     try {
//         const authorizationHeader = req.headers.authorization;
//
//         if (!authorizationHeader) {
//             return next(ApiError.UnauthorizedError())
//         }
//
//         const accessToken = authorizationHeader.split(' ')[1];
//
//         if (!accessToken) {
//             return next(ApiError.UnauthorizedError())
//         }
//
//         const userData = tokenService.validateAccessToken(accessToken);
//
//         if (!userData) {
//             return next(ApiError.UnauthorizedError())
//         }
//
//         req.user = userData;
//
//         next();
//
//     } catch (e) {
//         return next(ApiError.UnauthorizedError())
//     }
// }