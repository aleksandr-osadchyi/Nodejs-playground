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
        const next = () => {
            currentMiddleware++;
            const middleware = this.middlewares[currentMiddleware - 1];
            if (middleware) {
                middleware(req, res, next);
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
    return res;
};

const middleware = (req, res, next) => {
    return next();
}

module.exports = {WebApplication};