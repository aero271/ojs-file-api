
import http from 'http';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv'

dotenv.config();

const server = http.createServer(async (req, res) => {
    const key = req.headers['authorization']
    if (typeof key == 'undefined') {
        res.writeHead(401, 'Unauthorized');
        res.end()
        return;
    }

    if (createHash('sha256').update(key).digest('hex') != process.env.KEY) {
        res.writeHead(401, 'Unauthorized');
        res.end()
        return;
    }

    const url = new URL(req.url, `http://${req.headers['host']}`);
    const path = url.searchParams.get('path');

    if (!existsSync('files' + path)) {
        res.writeHead(404, 'Resource Not Found');
        res.end();
        return;
    }
    const file = await readFile('files/' + path);

    res.writeHead(200, {'Content-Type': 'application/pdf'});
    res.end(file);
});

server.listen(8000);