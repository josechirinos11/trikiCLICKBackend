const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const { WebSocketTransport } = require("@colyseus/core");

const { Room } = require("colyseus");

class GameRoom extends Room {
  maxClients = 4;

  onCreate() {
    this.setState({ players: {}, creator: null });
    console.log("Sala creada con éxito");

    this.onMessage("move", (client, data) => {
      if (this.state.players[client.sessionId]) {
        this.state.players[client.sessionId].x = data.x;
        this.state.players[client.sessionId].y = data.y;
        this.state.players[client.sessionId].z = data.z;
        this.broadcast("update", { id: client.sessionId, pos: data });
      }
    });

    this.onMessage("message", (client, message) => {
      this.broadcast("chat", { sender: client.sessionId, text: message.text });
    });

    this.onMessage("player_ready", (client, data) => {
      const parsedData = JSON.parse(data);
      if (this.state.players[client.sessionId]) {
        this.state.players[client.sessionId].ready = parsedData.ready;
        this.broadcast("update_ready", this.state.players);
      }
    });

    this.onMessage("start_game", (client) => {
      if (client.sessionId === this.state.creator) {
        const allReady = Object.values(this.state.players).every(player => player.ready);
        if (allReady) {
          this.broadcast("start_game");
        }
      }
    });

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
      playerName: options.playerName || "Guest",
      ready: false
    };
    
    if (!this.state.creator) {
      this.state.creator = client.sessionId;
    }
    
    console.log(`${options.playerName} se unió a la sala.`);
    this.broadcast("players", this.state.players);
  }

  onLeave(client) {
    delete this.state.players[client.sessionId];
    if (this.state.creator === client.sessionId) {
      this.state.creator = Object.keys(this.state.players)[0] || null;
    }
    this.broadcast("update", this.state.players);
    console.log(`Jugador ${client.sessionId} salió de la sala.`);
  }
}

const app = express();
const server = createServer(app);

// Usar WebSocketTransport correctamente
const { WebSocketTransport } = require("@colyseus/core");

const gameServer = new Server({
  transport: new WebSocketTransport({
    pingInterval: 10000,     // Intervalo de ping
    pingMaxRetries: 3,       // Máximo número de intentos de ping
    server: server,          // El servidor HTTP que usa WebSocket
    verifyClient: (info) => {  // Lógica de validación del cliente (opcional)
      // Puedes incluir tu lógica de validación aquí si es necesario
      return true;
    }
  })
});


gameServer.define("game", GameRoom);


server.listen(2567, () => console.log("Servidor Colyseus CORRIENDO ANDA, VIVA LA LIBERTAD CARAJOOOOOO"));
