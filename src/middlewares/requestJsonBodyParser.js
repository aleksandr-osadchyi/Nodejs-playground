const requestJsonBodyParser = () => {
    return (req, res, next) => {
        if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') {
            return next();
        }
        let body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
                next();
            } catch (e) {
                next(e);
            }
        });
    };
}
module.exports = {requestJsonBodyParser}