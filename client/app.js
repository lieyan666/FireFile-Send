/*
 * @Author: Lieyan
 * @Date: 2024-10-16 18:37:30
 * @LastEditors: Lieyan
 * @LastEditTime: 2024-10-16 19:22:37
 * @FilePath: /FireFile-Send/client/app.js
 * @Description: 
 * @Contact: QQ: 2102177341  Website: lieyan.space  Github: @lieyan666
 * @Copyright: Copyright (c) 2024 by lieyanDevTeam, All Rights Reserved. 
 */
const axios = require('axios');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const CONFIG = require('./config.json');
let serverUrl = CONFIG.serverUrl;
let downloadDir = CONFIG.downloadDir;

// check&init
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}
const socket = io(serverUrl);

console.log('Server Addr: ' + serverUrl);

// listen
socket.on('newFile', (file) => {
  console.log('New file available:', file.originalname);
  downloadFile(file);
});

// dl
function downloadFile(file) {
  const filePath = path.join(downloadDir, file.originalname);
  const url = `${serverUrl}/uploads/${file.filename}`;
  axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  }).then((response) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', () => {
      console.log(`${file.originalname} downloaded successfully.`);
      // refresh
      markFileAsDownloaded(file);
    });
  }).catch((err) => {
    console.error('Error downloading file:', err);
  });
}

// fetch
function fetchAndDownloadFiles() {
  axios.get(`${serverUrl}/files`)
    .then((response) => {
      const files = response.data;
      files.forEach(file => {
        downloadFile(file);
      });
    })
    .catch((err) => {
      console.error('Error fetching files:', err);
    });
}

// mark
function markFileAsDownloaded(file) {
  axios.post(`${serverUrl}/file-downloaded`, { filename: file.filename })
    .then(() => {
      console.log(`${file.originalname} marked as downloaded.`);
    })
    .catch((err) => {
      console.error('Error marking file as downloaded:', err);
    });
}

// conf page
const express = require('express');
const configApp = express();
configApp.use(express.static('client-config'));

// app conf
configApp.listen(3001, () => {
  console.log('Client configuration page running on http://localhost:3001');
});

// 开始拉取未下载文件
fetchAndDownloadFiles();