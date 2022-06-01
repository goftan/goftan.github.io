// const myrouter = require('router.js')
const express = require('express');
const app = express();
app.use(
    cors({
      origin: ["*"],
      methods: ["GET", "POST", "DELETE"],
      credentials: true,
      origin: true,
    })
  );
// app.use('/');
// app.l
//const router = express.Router();
//cors
app.get('/', (req, res) => {
    res.send('Hello World!');
});

db = [];

app.get('/quiz', (req, res) => {
    console.log(req);
    console.log(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
//     const content = 'Some content!';
//     const fs = require('fs');
// fs.writeFile('test.txt', content, err => {
//   if (err) {
//     console.error(err);
//   }
//   // file written successfully
// });

});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


