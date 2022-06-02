// const myrouter = require('router.js')
const express = require('express');
var cors = require('cors')
const app = express();
const mongoose = require('mongoose');
const { Schema } = mongoose;


mongoose.connect('mongodb://localhost:27017/test');

const userSchema = new Schema({
    name:  String, 
    email: String,
    pass: String,
    points:   String,
    languages: [],
});


const User = mongoose.model('User', userSchema);

const newUser = new User({name: 'test', email: 'test@test.de', pass: 'test', points: '0', languages: []});



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
    q = User.find({email: req.body.email, pass: req.body.pass}, function(err, docs) {
      console.log(err,docs);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(q.length !== 0) {
      res.send({status:'success', message: 'You are logged in', points: q[0].points});
    } else {
      res.send({status:'success', message: 'You are not logged in', points: '0'});
    }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


