const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const { Room } = require("colyseus");

class GameRoom extends Room {
  // Límite de jugadores por sala
  maxClients = 4;

  onCreate() {
    this.setState({ players: {} });
    console.log("Sala creada con éxito");

    // Manejo de movimiento de jugadores
    this.onMessage("move", (client, data) => {
      if (this.state.players[client.sessionId]) {
        this.state.players[client.sessionId].x = data.x;
        this.state.players[client.sessionId].y = data.y;
        this.state.players[client.sessionId].z = data.z;
        this.broadcast("update", { id: client.sessionId, pos: data });
      }
    });

    // Enviar mensaje personalizado
    this.onMessage("message", (client, message) => {
      this.broadcast("chat", { sender: client.sessionId, text: message });
    });

    // Sistema de latidos (heartbeat)
    this.clock.setInterval(() => {
      this.broadcast("heartbeat", { timestamp: Date.now() });
    }, 5000);
  }

  onJoin(client, options) {
    if (Object.keys(this.state.players).length >= this.maxClients) {
      client.leave();
      return;
    }
    
    this.state.players[client.sessionId] = {
      x: 0,
      y: 0,
      z: 0,
      playerName: options.playerName || "Guest"
    };
    console.log(`${options.playerName} se unió a la sala.`);
    this.broadcast("players", this.state.players);
  }

  onLeave(client) {
    delete this.state.players[client.sessionId];
    this.broadcast("update", this.state.players);
    console.log(`Jugador ${client.sessionId} salió de la sala.`);
  }
}

const app = express();
const server = createServer(app);
const gameServer = new Server({ server });

gameServer.define("game", GameRoom);
server.listen(2567, () => console.log("Servidor Colyseus corriendo en el puerto 2567"));
