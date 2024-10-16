/*
 * @Author: Lieyan
 * @Date: 2024-10-16 18:36:05
 * @LastEditors: Lieyan
 * @LastEditTime: 2024-10-16 19:31:09
 * @FilePath: /FireFile-Send/server/server.js
 * @Description: 
 * @Contact: QQ: 2102177341  Website: lieyan.space  Github: @lieyan666
 * @Copyright: Copyright (c) 2024 by lieyanDevTeam, All Rights Reserved. 
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const CONFIG = require('./config.json'); // 加载配置文件
const UPLOAD_PASSWORD = CONFIG.uploadPassword;

// upload path
const upload = multer({ dest: 'uploads/' });
let fileQueue = [];

// static
app.use(express.static(path.join(__dirname, 'public')));

// download API
/*
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath, (err) => {
        if (err) {
            console.error('File download error:', err);
            res.status(404).send('File not found.');
        }
    });
});*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// upload API
app.post('/upload', upload.single('file'), (req, res) => {
    const { password } = req.body; // pswd
    if (password !== UPLOAD_PASSWORD) {
      return res.status(403).send('Invalid password.');
    }
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const fileRecord = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      downloaded: false
    };
    fileQueue.push(fileRecord);
    console.log('newFile' + fileRecord + fileQueue)
    io.emit('newFile', fileRecord);

    res.send('File uploaded successfully.');
  });

// file list
app.get('/files', (req, res) => {
  const undownloadedFiles = fileQueue.filter(file => !file.downloaded);
  res.json(undownloadedFiles);
});

// start srv.
server.listen(CONFIG.serverPort, () => {
  console.log(`Server lisetning ${CONFIG.serverPort}`);
});