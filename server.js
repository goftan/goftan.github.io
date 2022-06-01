const express = require('express');
const app = express();
// app.use('/');
// app.l
//const router = express.Router();
//cors
app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})