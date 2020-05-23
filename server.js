const http = require('http');
const {WebApplication} = require('./src/webApplication');
const {serveStatic} = require('./src/middlewares/serveStatic');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
const webApplication = new WebApplication();
const publicFolderPath = path.join(__dirname, './public');

webApplication.use(serveStatic({publicFolder: publicFolderPath}));
webApplication.get('/', (req, res) => {
    res.file(path.join(publicFolderPath, 'index.html'));
});
webApplication.get('/test-url', (req, res) => {
    res.text(req.path);
});
webApplication.get('/error-url-with-error', (req, res) => {
    let error = new Error('This is test error')
    error.statusCode = 422;
    throw error;
});
webApplication.use((req, res, next) => {
    res.text('404 page', 404);
});
webApplication.use((error, req, res, next) => {
    res.text(error.toString(), error.statusCode || 500);
});

const server = http.createServer(webApplication.handle.bind(webApplication));

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
