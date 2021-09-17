/* eslint-disable consistent-return */
/* eslint-disable no-undef */
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const db = require('../models');

const User = db.user;
const { ROLES } = db;

verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({
      message: 'No token provided!'
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized!'
      });
    }
    req.userId = decoded.id;
    next();
  });
};

isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i += 1) {
        if (roles[i].name === ROLES[1]) {
          next();
          return;
        }
      }

      res.status(403).send({
        message: 'Require Admin Role!'
      });
    });
  });
};

isModerator = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i += 1) {
        if (roles[i].name === ROLES[2]) {
          next();
          return;
        }
      }

      res.status(403).send({
        message: 'Require Moderator Role!'
      });
    });
  });
};

isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i += 1) {
        if (roles[i].name === ROLES[2]) {
          next();
          return;
        }

        if (roles[i].name === ROLES[1]) {
          next();
          return;
        }
      }

      res.status(403).send({
        message: 'Require Moderator or Admin Role!'
      });
    });
  });
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin
};
module.exports = authJwt;
