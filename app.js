const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const FormData = require('form-data');
const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 2467;

const app = express();
app.use(bodyParser.json());


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp/uploads');
    },
    filename: function (req, file, cb) {
        const extArray = file.originalname.split('.');
        const extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-tmp-' + Date.now() + '.' + extension);
    }
});
const upload = multer({ storage: storage });
const cpUploads = upload.fields([
    { name: 'gallery', maxCount: 8 },
    { name: 'croquis', maxCount: 2 },
    { name: 'signature', maxCount: 2 },
    { name: 'degat', maxCount: 2 }
]);

const router = express.Router();
router.post('/send', cpUploads, (req, res) => {
    const form = new FormData();
    for (let key in req.body) {
        form.append(key, req.body[key]);
    }
    for (let key in req.files) {
        console.log(key);
        for (let i = 0; i < req.files[key].length; i++) {
            form.append(key, fs.createReadStream('/tmp/uploads/' + req.files[key][i].filename));
        }
    }
    let request = http.request({
        method: 'post',
        host: '127.0.0.1',
        port: 2469,
        path: '/registry',
        headers: form.getHeaders()
    }, (response) => {
        response.on('data', (data) => {
            res.json(JSON.parse(data));
            for (let key in req.files) {
                for (let i = 0; i < req.files[key].length; i++) {
                    fs.unlink('/tmp/uploads/' + req.files[key][i].filename, (err) => {
                        if (err) {
                            console.log("not delete " + req.files[key][i].filename);
                        }
                    });
                }
            }
        });
    });
    form.pipe(request);
    request.on('error', (err) => {
        res.sendStatus(500);
    });
});

router.get('/download/:numero', (req, res) => {
    console.log("get download pdf");
    let request = http.request({
        method: 'get',
        host: '127.0.0.1',
        port: 2469,
        path: '/registry/' + req.params.numero,
    }, (response) => {
        response.on('data', (data) => {
            const form = JSON.parse(data).constatAmiable;
            console.log(form);
            let request2 = http.request({
                method: 'post',
                host: '127.0.0.1',
                port: 2468,
                path: '/pdf',
                headers: { 'Content-Type': 'application/json' }
            },
                (fileResponse) => {
                    const filename = '/tmp/uploads/response-tmp-' + Date.now() + '.pdf';
                    const writeStream = fs.createWriteStream(filename);
                    fileResponse.pipe(writeStream);
                    writeStream.on('finish', () => {
                        res.sendFile(filename);
                    });
                });
            request2.on('response', (r) => {
                console.log(r.statusCode);
            });
            request2.write(JSON.stringify(form));
            request2.end();
        });
    });
    request.on('response', (res) => {
        console.log(res.statusCode);
    });
    request.end();
});

app.use('/constat', router);

app.listen(PORT, () => {
    console.log("[constat-app-gateway] start at port " + PORT);
});