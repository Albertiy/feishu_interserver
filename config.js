const fs = require('fs');

/**
 * 获取 application.config.json
 * @returns {{
 * port: number,
 * env: string,
 * staticPath: string,
 * logDirectory: string,
 * app_id,
 * app_secret,
 * }}
 */
exports.application = function () {
    try {
        return JSON.parse(fs.readFileSync('./config/application.config.json'));
    } catch (error) {
        console.log('错误：application.config.json: %o', error)
        return {};
    }
}

/**
 * 获取 database.config.json
 * @returns {{
 * }}
 */
exports.database = function () {
    try {
        return JSON.parse(fs.readFileSync('./config/database.config.json'));
    } catch (_) {
        return {};
    }
}