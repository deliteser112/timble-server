/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */

const jwt = require('jsonwebtoken');
const db = require('../models');

const config = require('../config/auth.config');

const JWT_SECRET = config.secret;

const Office = db.office;
const Company = db.company;
const { sequelize } = db;

exports.getOfficeList = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);

  Company.findOne({ where: { id: companyId } }).then((company) => {
    const plan = company.planType;
    Office.findAll({
      where: { companyId, isActive: 1 }
    }).then((offices) => {
      const officeList = [];
      let limits = 0;
      if (plan === 'free') {
        limits = 2;
      } else {
        limits = offices.length;
      }
      offices.map((office, index) => {
        if (index < limits) {
          officeList.push({
            id: office.id,
            emoji: office.emoji,
            name: office.name,
            capacity: office.capacity
          });
        }
      });
      res.status(200).send(officeList);
    });
  });
};

exports.getManagerList = (req, res) => {
  sequelize
    .query('SELECT officeId, userId FROM `user_offices` WHERE isManager = 1', {
      type: sequelize.QueryTypes.SELECT
    })
    .then((users) => {
      res.status(200).send(users);
    });
};

exports.updateOfficeList = (req, res) => {
  const officeList = req.body;
  officeList.map((reqOffice) => {
    const updateValues = {
      emoji: reqOffice.emoji,
      name: reqOffice.name,
      capacity: reqOffice.capacity
    };
    Office.update(updateValues, { where: { id: reqOffice.id } });

    const sql = `UPDATE user_offices SET isManager = 0`;
    sequelize
      .query(sql, {
        type: sequelize.QueryTypes.UPDATE
      })
      .then(() => {
        reqOffice.managers.map((manager) => {
          const sql = `
          UPDATE user_offices
          SET isManager = 1
          WHERE userId = ${manager.id} and officeId = ${reqOffice.id};
        `;
          sequelize.query(sql, {
            type: sequelize.QueryTypes.UPDATE
          });
        });
      });
  });
  res.status(200).send('success');
};

exports.deleteOffice = (req, res) => {
  const { officeId } = req.body;
  Office.update(
    { isActive: 0 },
    {
      where: {
        id: officeId
      }
    }
  );
  res.status(200).send({ message: 'Deleted successfully!' });
};

exports.addOffice = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  Office.create({
    emoji: '🙂',
    name: 'New Office',
    capacity: 5,
    companyId
  }).then((officeList) => {
    const data = {
      id: officeList.id
    };
    res.status(200).send(data);
  });
};
