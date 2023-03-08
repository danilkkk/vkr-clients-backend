import colors from 'colors';

export function info(message) {
    console.log(colors.green.bold('[logger]'), colors.green.italic.bold(`info: ${message}`));
}

export function error(error) {
    console.log(colors.red('[logger]'), colors.red.bold(`error: ${error}`));
    console.trace(error);
}

const logger = {
    info,
    error
}

export default logger;