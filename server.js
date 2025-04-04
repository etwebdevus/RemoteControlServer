const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

app.get('/check_status', (req, res) => {
    res.send('Server is running!');
  });

console.log("WebSocket Server running on ws://localhost:8080");

wss.on('connection', (ws) => {
    console.log("Client connected!");

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const { id, image, type } = message;
            const mouseEvents = ['mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'keydown', 'keyup'];
            if (mouseEvents.includes(type)) {
                console.log("Received data", JSON.parse(data));
                // Broadcast the image to all connected clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            } else if (id && image) {
                const buffer = Buffer.from(image, 'base64');
                const filePath = path.join('public/screenshots', `screen_${id}.jpg`);
                fs.writeFileSync(filePath, buffer);
                console.log(`Saved screenshot to ${filePath}`);

                // Broadcast the image to all connected clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ id, image }));
                    }
                });
            } else {
                console.error("Invalid message format");
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});