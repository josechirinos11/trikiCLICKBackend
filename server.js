const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const { Room } = require("colyseus");

class GameRoom extends Room {
  onCreate() {
    this.setState({ players: {} });

    this.onMessage("move", (client, data) => {
      this.state.players[client.sessionId] = data;
      this.broadcast("update", this.state.players);
    });

    this.onMessage("disconnect", (client) => {
      delete this.state.players[client.sessionId];
      this.broadcast("update", this.state.players);
    });
  }

  onJoin(client) {
    this.state.players[client.sessionId] = { x: 0, y: 0, z: 0 };
  }
}

const app = express();
const server = createServer(app);
const gameServer = new Server({ server });

gameServer.define("game", GameRoom);
server.listen(2567, () => console.log("Servidor Colyseus corriendo en el puerto 2567"));
