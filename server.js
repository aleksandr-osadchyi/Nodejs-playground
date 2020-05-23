const http = require('http');
const {WebApplication} = require('./src/web-application');

const hostname = '127.0.0.1';
const port = 3000;
const webApplication = new WebApplication();

webApplication.get('/', (req, res) => {
    res.text('Home page');
});
webApplication.get('/test-url', (req, res) => {
    res.text(req.path);
});
webApplication.use((req, res) => {
    res.text('404 page', 404);
});

const server = http.createServer(webApplication.handle.bind(webApplication));

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
