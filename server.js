const express = require('express');
var cors = require('cors')
const mongoose = require('mongoose');
const { query } = require('express');
const { Schema } = mongoose;
require('dotenv').config();


const app = express();

// main().catch(err => console.log(err));
// async function main() {
// mongoose.connect(process.env.MONGO_ACCESS);


app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(express.json({
  type: ['application/json', 'text/plain']
}))


app.use(
    cors({
      origin: ["*"],
      methods: ["GET", "POST", "DELETE"],
      credentials: true,
      origin: true,
    })
  );

  const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_ACCESS);
    console.log(`MongoDB connected ${conn.connection.host}`);
  };

  connectDB();
  const UserModel = mongoose.model('User', new Schema({ 
    user: String,
    pass: String,
    points: Array
  }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/signin', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(req.body == undefined) return;
    UserModel.find({user: req.body.username}).exec().then(user_query => {
      console.log(user_query);
      if(user_query.length !== 0) {
        q = user_query[0];
        if(q.pass === req.body.password) {
          res.send({username: req.body.username, status:'loggedin', points: q.points});
        } else {
          res.send({username: req.body.username, status:'wrongpassword'});
        }
      } else {
        const newUser = new UserModel({ 
          user: req.body.username,
          pass: req.body.password,
          points: []
         });
        newUser.save();
        res.send({username: req.body.username, status:'registered', points: []});
      }
    });
});

app.post('/addresult', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if(req.body == undefined) return;
    UserModel.findAndUpdate({user: req.body.username})
      .exec().then(user_query => {
      console.log(user_query);
      if(user_query.length !== 0) {
        q = user_query[0];
        q.points.push(req.body.result);
        q.save();
        res.send({username: req.body.username, status:'loggedin', points: q.points});
      }
    });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

//'mongodb+srv://ali:<password>@cluster0.6iqcuzr.mongodb.net/?retryWrites=true&w=majority'


