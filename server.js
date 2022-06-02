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
    if(db[req.body.email] !== undefined) {
      res.send({status:'success', message: 'You are logged in', points: db[req.body.email].points});
    } else {
      res.send({status:'success', message: 'You are not logged in', points: '0'});
    }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


