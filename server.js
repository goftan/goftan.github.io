// const myrouter = require('router.js')
const express = require('express');
var cors = require('cors')
const app = express();

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

db = [];

app.post('/quiz', (req, res) => {
    console.log(req);
    console.log(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send({status:'success'});

});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


