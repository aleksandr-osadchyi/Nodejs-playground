const http = require('http');
const {Router} = require('./src/router');
const {serveStatic} = require('./src/middlewares/serveStatic');
const {requestJsonBodyParser} = require('./src/middlewares/requestJsonBodyParser');
const bodyParser = require('body-parser');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
const router = new Router();
const publicFolderPath = path.join(__dirname, './public');

router.use(serveStatic({publicFolder: publicFolderPath}));
router.use(requestJsonBodyParser());
router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res) => {
    res.file(path.join(publicFolderPath, 'index.html'));
});
router.get('/test-url', (req, res) => {
    res.text(req.path);
});
router.get('/error', (req, res) => {
    let error = new Error('This is test error')
    error.statusCode = 422;
    throw error;
});
router.post('/post', (req, res) => {
    res.json(req.body);
});
router.use((req, res, next) => {
    res.text('404 page', 404);
});
router.use((error, req, res, next) => {
    res.text(error.toString(), error.statusCode || 500);
});

const server = http.createServer(router.handle.bind(router));

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
