/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */
const jwt = require('jsonwebtoken');
const db = require('../models');

const { sequelize } = db;
const Team = db.team;
const Company = db.company;
const config = require('../config/auth.config');

const JWT_SECRET = config.secret;

exports.getTeamList = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  Company.findOne({ where: { id: companyId } }).then((company) => {
    const plan = company.planType;
    Team.findAll({
      where: { companyId, isActive: 1 }
    }).then((teams) => {
      const teamList = [];
      let limits = 0;
      if (plan === 'free') {
        limits = 2;
      } else {
        limits = teams.length;
      }
      teams.map((team, index) => {
        if (index < limits) {
          teamList.push({
            id: team.id,
            color: team.color,
            name: team.name,
            capacity: team.capacity
          });
        }
      });
      res.status(200).send(teamList);
    });
  });
};

exports.addTeam = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);

  Team.create({
    color: '#9900EF',
    name: 'New Team',
    capacity: 5,
    companyId
  }).then((teamList) => {
    const data = {
      id: teamList.id
    };
    res.status(200).send(data);
  });
};

exports.deleteTeam = (req, res) => {
  const { teamId } = req.body;
  Team.update(
    { isActive: 0 },
    {
      where: {
        id: teamId
      }
    }
  );
  res.status(200).send({ message: 'Deleted successfully!' });
};

exports.updateTeamList = (req, res) => {
  const teamList = req.body;
  teamList.map((team) => {
    const updateValues = {
      color: team.color,
      name: team.name,
      capacity: Number(team.capacity)
    };
    Team.update(updateValues, { where: { id: team.id } });
    const sql = `UPDATE user_teams SET isManager = 0`;
    sequelize
      .query(sql, {
        type: sequelize.QueryTypes.UPDATE
      })
      .then(() => {
        team.managers.map((manager) => {
          const sql = `
          UPDATE user_teams
          SET isManager = 1
          WHERE userId = ${manager.id} and teamId = ${team.id};
        `;
          sequelize.query(sql, {
            type: sequelize.QueryTypes.UPDATE
          });
        });
      });
  });
  res.status(200).send('success');
};

exports.getTManagerList = (req, res) => {
  sequelize
    .query('SELECT teamId, userId FROM `user_teams` WHERE isManager = 1', {
      type: sequelize.QueryTypes.SELECT
    })
    .then((users) => {
      res.status(200).send(users);
    });
};
