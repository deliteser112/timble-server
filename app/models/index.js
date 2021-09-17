/* eslint-disable array-callback-return */
const Sequelize = require('sequelize');
const config = require('../config/db.config.js');

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  operatorsAliases: 0,

  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require('./user.model.js')(sequelize, Sequelize);
db.role = require('./role.model.js')(sequelize, Sequelize);
db.team = require('./team.model.js')(sequelize, Sequelize);
db.office = require('./office.model.js')(sequelize, Sequelize);
db.company = require('./company.model.js')(sequelize, Sequelize);
db.calendar = require('./calendar.model.js')(sequelize, Sequelize);
db.basiclist = require('./basiclist.model.js')(sequelize, Sequelize);
db.customlist = require('./customlist.model.js')(sequelize, Sequelize);
db.workingdays = require('./workingdays.model.js')(sequelize, Sequelize);
db.organizations = require('./organizations.model.js')(sequelize, Sequelize);

// offices relative
db.office.belongsToMany(db.user, {
  through: 'user_offices',
  foreignKey: 'officeId',
  otherKey: 'userId'
});
db.user.belongsToMany(db.office, {
  through: 'user_offices',
  foreignKey: 'userId',
  otherKey: 'officeId'
});

// team relative
db.team.belongsToMany(db.user, {
  through: 'user_teams',
  foreignKey: 'teamId',
  otherKey: 'userId'
});
db.user.belongsToMany(db.team, {
  through: 'user_teams',
  foreignKey: 'userId',
  otherKey: 'teamId'
});

// calendar vs user relative
db.user.hasOne(db.calendar, {
  foreignKey: 'userId'
});
db.calendar.belongsTo(db.user);

db.ROLES = ['super admin', 'admin', 'leader', 'member'];

db.OFFICES = [
  { emoji: '👨‍👨‍👧', name: 'Office 1', capacity: 10 },
  { emoji: '⚖️', name: 'Office 2', capacity: 10 }
];

db.TEAMS = [
  { color: '#00D084', name: 'Team 1', capacity: 10 },
  { color: '#9900EF', name: 'Team 2', capacity: 10 }
];

db.BASICLIST = [
  {
    emoji: '🏡',
    title: 'From home',
    description: 'Remote (works with Cities feature)',
    isActive: 1
  }
];

db.CUSTOMLIST = [
  {
    emoji: '🙂',
    title: 'Custom 1',
    isActive: 0
  }
];

db.WORKINGDAYS = '1,2,3,4,6';

db.ORGANIZATIONS = {
  isEmail: 1,
  isGoogleSignIn: 0,
  startingDay: 1,
  monthRange: 3,
  isCities: 0,
  isHalfDays: 1
};

const obj = {
  icon: '?',
  morning: { id: 0, type: 'undefined' },
  afternoon: { id: 0, type: 'undefined' },
  isHalf: false,
  isWork: false
};

const yData = [];
const MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
for (let i = 0; i < 12; i += 1) {
  const mData = [];
  for (let j = 0; j < MonthDays[i]; j += 1) {
    mData.push(obj);
  }
  yData.push(mData);
}

db.SCHEDULES = yData;

db.EMAIL_API_KEY =
  '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';

module.exports = db;
