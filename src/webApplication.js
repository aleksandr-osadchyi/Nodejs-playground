const fs = require('fs');
const util = require('util');
const fsAccess = util.promisify(fs.access);

const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST'
};

class WebApplication {
    constructor() {
        this.middlewares = [this.parsePath.bind(this)];
    }

    handle(req, res) {
        res = expandResponse(res);
        let currentMiddleware = 0;
        const next = (error) => {
            currentMiddleware++;
            const middleware = this.middlewares[currentMiddleware - 1];
            if (middleware) {
                try {
                    const isErrorMiddleware = middleware.length === 4;
                    if (error && isErrorMiddleware) {
                        return middleware(error, req, res, next);
                    }
                    if (error && !isErrorMiddleware) {
                        return next(error);
                    }
                    middleware(req, res, next);
                } catch (unhandledError) {
                    next(unhandledError);
                }
            }
        };
        next();
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    get(url, handler) {
       this.handleHttpMethod(HTTP_METHODS.GET, url, handler);
    }

    post(url, handler) {
        this.handleHttpMethod(HTTP_METHODS.POST, url, handler);
    }

    parsePath(req, res, next) {
        const urlParts = req.url.split('?');

        req.path = urlParts[0];

        const searchParams = new URLSearchParams(urlParts[1]);
        let parsedSearchParams = {};
        for (let [key, value] of searchParams.entries()) {
            parsedSearchParams[key] = value;
        }
        req.parsedSearchParams = parsedSearchParams;

        next();
    }

    handleHttpMethod(method, url, handler) {
        let rootHandler = (req, res, next) => {
            if (req.method !== method) {
                return next();
            }
            if (req.path !== url) {
                return next();
            }

            handler(req, res, next);
        };
        this.use(rootHandler);
    }
}

const expandResponse = (res) => {
    res.text = (text, statusCode = 200) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'text/plain');
        res.end(text);
    };
    res.json = (json, statusCode = 200) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(json));
    };
    res.file = async (pathToFile) => {
        try {
            await fsAccess(pathToFile, fs.constants.F_OK);
            const stream = fs.createReadStream(pathToFile);
            stream.pipe(res);
        } catch (e) {
            res.text('Not found', 404);
        }
    }
    return res;
};

const middleware = (req, res, next) => {
    return next();
}

module.exports = {WebApplication};