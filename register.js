const multer = require('multer');
const FormData = require('form-data');
const http = require('http');
const fs = require('fs');
const axios = require('axios');

module.exports = (router) => {

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
        { name: 'croquis', maxCount: 4 },
        { name: 'signature', maxCount: 4 },
    ]);

    router.post('/send', cpUploads, (req, res) => {
        const form = new FormData();
        for (let key in req.body) {
            form.append(key, req.body[key]);
        }
        for (let key in req.files) {
            for (let i = 0; i < req.files[key].length; i++) {
                form.append(key, fs.createReadStream('/tmp/uploads/' + req.files[key][i].filename));
            }
        }
        let request = http.request({
            method: 'post',
            host: 'localhost',
            port: 2469,
            path: '/registry',
            headers: form.getHeaders()
        }, (response) => {
            response.on('data', (data) => {
                try {
                    const obj = JSON.parse(data);
                    const numero = obj.saveConstat.numero;
                    const assuranceA = obj.saveConstat.a.assurance;
                    const assuranceB = obj.saveConstat.b.assurance;
                    notify(numero, assuranceA);
                    setTimeout(() => {
                        notify(numero, assuranceB);
                    }, 5000);
                    res.json(obj);
                    for (let key in req.files) {
                        for (let i = 0; i < req.files[key].length; i++) {
                            fs.unlink('/tmp/uploads/' + req.files[key][i].filename, (err) => {
                                if (err) {
                                    console.log("not delete " + req.files[key][i].filename);
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                } finally {

                }
            });
        });
        form.pipe(request);
        request.on('error', (err) => {
            console.log(err);
            res.sendStatus(500);
        });
    });
    
}

async function notify(numero, assurance){
    const result = await axios.post("http://localhost:2471/constats", {
        numero, assurance
    })
    console.log(result.data);
}

