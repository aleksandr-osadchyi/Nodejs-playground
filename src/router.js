const fs = require('fs');
const util = require('util');
const fsAccess = util.promisify(fs.access);

const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST'
};

class Router {
    constructor() {
        this.middlewares = [];
    }

    handle(req, res) {
        req = expandRequest(req);
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

    use(...params) {
        let firstArgument = params[0];
        let url = undefined;
        let middleware = undefined;
        if (typeof firstArgument === "string") {
            url = firstArgument;
            middleware = params[1];
        } else {
            middleware = params[0];
        }
        const isErrorMiddleware = middleware.length === 4;
        let rootHandler;
        if (isErrorMiddleware) {
            rootHandler = (error, req, res, next) => {
                if (url && !req.path.startsWith(url)) {
                    return next();
                }
                middleware(error, req, res, next);
            };
        } else {
            rootHandler = (req, res, next) => {
                if (url && !req.path.startsWith(url)) {
                    return next();
                }
                middleware(req, res, next);
            };
        }

        this.middlewares.push(rootHandler);
    }

    get(url, handler) {
       this.handleHttpMethod(HTTP_METHODS.GET, url, handler);
    }

    post(url, handler) {
        this.handleHttpMethod(HTTP_METHODS.POST, url, handler);
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
        this.use(url, rootHandler);
    }
}

const expandRequest = (req) => {
    const urlParts = req.url.split('?');

    req.path = urlParts[0];

    const searchParams = new URLSearchParams(urlParts[1]);
    let parsedSearchParams = {};
    for (let [key, value] of searchParams.entries()) {
        parsedSearchParams[key] = value;
    }
    req.parsedSearchParams = parsedSearchParams;

    return req;
};

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

module.exports = {Router: Router};