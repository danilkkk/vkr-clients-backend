import logger from "../logger.js";
import ApiError from "../exceptions/api-error.js";

export default function (err, req, res, next) {
    logger.error(err);
    if (err instanceof ApiError) {
        const { status, message, errors } = err;
        return res.status(status).json({ message, errors })
    }

    return res.status(500).json({ message: 'Произошла непредвиденная ошибка' })
}