const express = require('express');
var cors = require('cors')
const mongoose = require('mongoose');
const { Schema } = mongoose;

require('dotenv').config();


const app = express();

mongoose.connect(process.env.MONGO_ACCESS);
const UserModel = mongoose.model('User', new Schema({ 
  user: String,
  pass: String,
  points: Array
}));


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
    q = UserModel.find({user: req.username});
    if(q.length !== 0) {
      if(db[req.username] === req.password) {
        res.send({username: req.username, status:'loggedin', points: db[req.username].points});
      } else {
        res.send({username: req.username, status:'wrongpassword'});
      }
    } else {
      const newUser = new UserModel({ 
        user: req.username,
        pass: req.password,
        points: []
       });
      newUser.save();
      res.send({username: req.username, status:'registered', points: []});
    }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

//'mongodb+srv://ali:<password>@cluster0.6iqcuzr.mongodb.net/?retryWrites=true&w=majority'


