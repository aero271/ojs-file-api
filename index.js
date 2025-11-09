
import http from 'http';
import { createHash } from 'crypto';
import { existsSync, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import dotenv from 'dotenv'

dotenv.config();

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };

function checkAuth(req, res) {
    const key = req.headers['authorization']
    if (typeof key == 'undefined') {
        res.writeHead(401, 'Unauthorized');
        res.end();
        return false;
    }

    if (createHash('sha256').update(key).digest('hex') != process.env.KEY) {
        res.writeHead(401, 'Unauthorized');
        res.end();
        return false;
    }
    return true;
}

async function authNeededGet(req, res, path) {
    if (!checkAuth(req, res)) return;

    if (!existsSync('files' + path)) {
        res.writeHead(404, 'Resource Not Found');
        res.end();
        return;
    }
    const file = await readFile('files/' + path);

    res.writeHead(200, {'Content-Type': 'application/pdf'});
    res.end(file);
}

async function handleGet(req, res, fileName) {
    if (!existsSync('files/' + fileName)) {
        res.writeHead(404, 'Resource Not Found');
        res.end();
        return;
    }
    const file = await readFile('files/' + fileName);
    const contentType = mimeTypes[extname(fileName)];
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
}

async function handlePost(req, res, path) {
    if (!checkAuth(req, res)) return;

    const fileStream = createWriteStream('files/' + path);
    req.pipe(fileStream);
    req.on('end', () => { 
        res.writeHead(200);
        res.end();
    });
}

const server = http.createServer(async (req, res) => {

    const url = new URL(req.url, `http://${req.headers['host']}`);
    const path = url.searchParams.get('path');
    if (!path) {
        return;
    }

    if (req.method === 'GET') {
        for (let i = 0; i < path.length; i++) {
            if (path[i] === '/') {
                authNeededGet(req, res, path);
                return;
            }
        }
        await handleGet(req, res, path);
        return;
    }
    else if (req.method === 'POST') {
        await handlePost(req, res, path);
        return;
    }
});

server.listen(8000);