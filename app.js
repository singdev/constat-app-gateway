const express = require('express');
const bodyParser = require('body-parser');
const register = require('./register');
const download = require('./download');

const PORT = process.env.PORT || 2467;

const app = express();
app.use(bodyParser.json());


const router = express.Router();

register(router);
download(router);

app.use('/constat', router);

app.listen(PORT, () => {
    console.log("[constat-app-gateway] start at port " + PORT);
});
