const express = require('express');
var cors = require('cors')
const app = express();
const fs = require('fs');

let dbstr = fs.readFileSync('db.json');
dbjson = JSON.parse(dbstr);
db = {}
for(d in dbjson) {
  db[d.email] = d.password;
}

app.use(
    cors({
      origin: ["*"],
      methods: ["GET", "POST", "DELETE"],
      credentials: true,
      origin: true,
    })
  );

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/quiz', (req, res) => {
    console.log(req);
    console.log(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(db[req.username] !== undefined) {
      if(db[req.username] === req.password) {
        res.send({username: req.username, status:'loggedin', points: db[req.username].points});
      } else {
        res.send({username: req.username, status:'wrongpassword'});
      }
    } else {
      db[req.username] = {
        "username": req.username,
        "pass": req.password,
        "points":   []
      };
      res.send({username: req.username, status:'registered', points: []});
    }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


