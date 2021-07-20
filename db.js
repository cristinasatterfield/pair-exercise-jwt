const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const SALT_COUNT = 5
const secret = process.env.JWT;
const { STRING } = Sequelize;
const config = {
  logging: false
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING
})

User.byToken = async (token) => {
  try {
    const payload = await jwt.verify(token, secret);
    if (payload) {
      const user = await User.findByPk(payload.userId);
      if (user) {
        return user;
      }
    }else{
      const error = Error("bad credentials");
      error.status = 401;
      throw error;
    }
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {

  const user = await User.findOne({
    where: {
      username
    }
  });

  if (user && await bcrypt.compare(password, user.password)){
    const token = await jwt.sign({ userId: user.id }, secret )
    return token
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate( async (user)  => {

  user.password = await bcrypt.hash(user.password, SALT_COUNT)
})

User.hasMany(Note)
Note.belongsTo(User)

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' }
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map(credential => User.create(credential))
  );

  const notes = [
    {text: "hello"},
    {text: "world"},
    {text: "hacker"}
  ]

  const [note1, note2, note3] = await Promise.all(
    notes.map(note => Note.create(note))
  );

  await lucy.addNote(note1)
  await lucy.addNote(note2)
  await moe.addNote(note3)
  


  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
