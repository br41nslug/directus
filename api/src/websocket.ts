import * as http from 'http';
import { Socket } from 'net';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import env from './env';
import logger from './logger';

const WS_PATH = env.WEBSOCKET_PATH ?? '/websocket';

export function createWebsocketServer(server: http.Server): WebSocketServer {
	const wsServer = new WebSocketServer({
		noServer: true,
		path: WS_PATH,
	});
	wsServer.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
		const cid = uuidv4();
		logger.info(`[${cid}]: client connected ${req}`);
		ws.addEventListener('message', async (message: object) => {
			logger.info(`[${cid}]: message - ${JSON.stringify(message)}`);
		});
		ws.addEventListener('error', () => {
			logger.info(`[${cid}]: client errored`);
		});
		ws.addEventListener('close', () => {
			logger.info(`[${cid}]: client left`);
		});
	});
	server.on('listening', () => {
		logger.info(`Websocket listening on ws://localhost:${env.PORT}${WS_PATH}`);
	});
	server.on('upgrade', (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
		wsServer.handleUpgrade(request, socket, head, (websocket: WebSocket) => {
			wsServer.emit('connection', websocket, request);
		});
	});
	return wsServer;
}
