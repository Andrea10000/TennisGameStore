const express = require('express');
const WebSocket = require('ws');
const mysql = require('mysql');

const server = express()
  .use(express.static('public'))
  .listen(3000, () => console.log('Listening on 3000'));

const ws_server = new WebSocket.Server({ server });
let scoreTeamA = 0;
let scoreTeamB = 0;
let gameScoreTeamA = 0;
let gameScoreTeamB = 0;
let setScoreTeamA = 0;
let setScoreTeamB = 0;
let clients = []; // Array to keep track of clients

const con = mysql.createConnection({
  host: "31.11.39.151:3306",
  user: "Sql1792877",
  password: "Bianchina2a@",
  database: "Sql1792877_2"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySQL database!");

  con.query("SELECT COUNT(*) AS count FROM Partita", function (err, result) {
    if (err) throw err;
    if (result[0].count === 0) {
      con.query("INSERT INTO Partita (squadra1, squadra2) VALUES ('Squadra A', 'Squadra B')", function (err, result) {
        if (err) throw err;
        console.log("Initial data inserted into Partita table");
      });
    }
  });
});

let data="";
let chiSono=0;

ws_server.on('connection', (ws) => {
  clients.push(ws); // Add new client to the array
  const clientIndex = clients.length - 1; // Determine the index of the connected client
  chiSono=clientIndex;
  ws.send(JSON.stringify({ 
    punteggio: { 
      squadra1: scoreTeamA, 
      squadra2: scoreTeamB,
      gameSquadra1: gameScoreTeamA,
      gameSquadra2: gameScoreTeamB,
      setSquadra1: setScoreTeamA,
      setSquadra2: setScoreTeamB
    },
    clientIndex: clientIndex // Send the client index to the client
  }));

  ws.on('message', (message) => {
    data = JSON.parse(message);
    if (data.chiediclient=='s'){
      //restituisco quale session sta chiamando
      ws_server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            numeroSessione:{
              numSessione: chiSono
            }
          }));
        }
      });
    }
      else
    {
  if (clientIndex != 1) { // Only the second client (index 1) is blocked
      const squadra = data.squadra;
      updateScore(squadra);

    } else {
      console.log('The second client is not allowed to modify the scores.');

    }
  }
    console.log('passa.');
  });

  ws.on('close', () => {
    const index = clients.indexOf(ws);
    if (index > -1) {
      clients.splice(index, 1); // Remove client from array on disconnect
    }
  });
});

function updateScore(squadra) {
  if (squadra === 'A') {
    if (scoreTeamA === 0) {
      scoreTeamA = 15;
    } else if (scoreTeamA === 15) {
      scoreTeamA = 30;
    } else if (scoreTeamA === 30) {
      scoreTeamA = 40;
    } else if (scoreTeamA === 40) {
      scoreTeamA = 0;
      gameScoreTeamA++;
      if (gameScoreTeamA === 6) {
        setScoreTeamA++;
        gameScoreTeamA = 0;
      }
    }
  } else if (squadra === 'B') {
    if (scoreTeamB === 0) {
      scoreTeamB = 15;
    } else if (scoreTeamB === 15) {
      scoreTeamB = 30;
    } else if (scoreTeamB === 30) {
      scoreTeamB = 40;
    } else if (scoreTeamB === 40) {
      scoreTeamB = 0;
      gameScoreTeamB++;
      if (gameScoreTeamB === 6) {
        setScoreTeamB++;
        gameScoreTeamB = 0;
      }
    }
  }
  con.query("INSERT INTO Punti (ID_Partita, punti, squadra) VALUES (?, ?, ?)", [1, 1, squadra === 'A' ? 1 : 2], function(err, result) {
    if (err) throw err;
    console.log("Punti aggiunti alla tabella Punti");
  });
  ws_server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ 
        punteggio: { 
          squadra1: scoreTeamA, 
          squadra2: scoreTeamB,
          gameSquadra1: gameScoreTeamA,
          gameSquadra2: gameScoreTeamB,
          setSquadra1: setScoreTeamA,
          setSquadra2: setScoreTeamB
        }, 
        set:{
          setPartita: data.set//ContatoreClient
        },
        nomiGiocatori:{
          nomeGiocatoreA: data.nomeGiocatoreSquadraA,
          nomeGiocatoreB: data.nomeGiocatoreSquadraB
        },
        numeroSessione:{
          numSessione: chiSono
        }
      }));
    }
  });
}

con.on('close', function(err) {
  if (err) {
    console.log('Errore nella chiusura della connessione al database:', err.message);
  } else {
    console.log('Connessione al database chiusa correttamente.');
  }
});
