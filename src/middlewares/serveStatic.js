const path = require('path');
const fs = require('fs');
const util = require('util');
const fsAccess = util.promisify(fs.access);

const serveStatic = ({publicFolder} = {}) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        if (!/\.[a-z0-9]*$/i.test(req.path)) {
            return next();
        }
        const pathToFile = path.join(publicFolder, req.path);
        try {
            await fsAccess(pathToFile, fs.constants.F_OK);
            const stream = fs.createReadStream(pathToFile);
            stream.pipe(res);
        } catch (e) {
            next();
        }
    };
};

module.exports = {serveStatic};