const http = require('http');
const fs = require('fs');

module.exports = (router) => {

    router.get('/download/:numero', (req, res) => {
        let request = http.request({
            method: 'get',
            host: 'localhost',
            port: 2469,
            path: '/registry/' + req.params.numero,
        }, (response) => {
            response.on('data', (data) => {
                const form = JSON.parse(data).constatAmiable;
                console.log(form);
                let request2 = http.request({
                    method: 'post',
                    host: 'localhost',
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
}