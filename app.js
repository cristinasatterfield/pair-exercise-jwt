const express = require('express');
const app = express();
app.use(express.json());
const { models: { User } } = require('./db');
const path = require('path');
// const jwt = require('jsonwebtoken');
// const secret = process.env.JWT;

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    // const userId = User.authenticate(req.body)
    // if (userId) {
    //   const token = await jwt.sign({ userId: userId })
    //   res.send({ token });
    // } else {
    //   res.status(401).send('Incorrect Login Info')
    // }
    res.send({ token: await User.authenticate(req.body) });
  }
  catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    // const token = req.headers.authorization;
    // const userInfo = await jwt.verify(token, secret);
    // console.log(userInfo)
    res.send(await User.byToken(req.headers.authorization));
  }
  catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
