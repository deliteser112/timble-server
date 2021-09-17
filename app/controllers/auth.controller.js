/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable import/order */
const db = require('../models');
const config = require('../config/auth.config');

const { sequelize } = db;

const User = db.user;
const Office = db.office;
const Team = db.team;
const Company = db.company;
const Calendar = db.calendar;
const BasicList = db.basiclist;
const Customlist = db.customlist;
const WorkingDays = db.workingdays;
const Organizations = db.organizations;

const {
  ROLES,
  OFFICES,
  TEAMS,
  BASICLIST,
  CUSTOMLIST,
  WORKINGDAYS,
  ORGANIZATIONS,
  SCHEDULES
} = db;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = config.secret;
const JWT_EXPIRES_IN = 86400;

const ADMIN = 2;
const MEMBER = 4;
exports.signup = (req, res) => {
  // Save User to Database
  User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    photoURL: '/static/uploads/1.jpg',
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then((userData) => {
      let emailCount = 0;
      let role = ADMIN;
      User.findAll().then(async (users) => {
        const reqEmail = req.body.email.split('@')[1].split('.')[0];
        const company = req.body.email.split('@')[1];
        users.map((user) => {
          const existEmail = user.email.split('@')[1].split('.')[0];
          if (reqEmail === existEmail) {
            emailCount += 1;
          }
        });

        if (emailCount > 1) {
          role = MEMBER;
          Company.findOne({
            where: {
              domain: company
            }
          }).then(async (company) => {
            const { accessToken, user } = await generateUser(
              userData,
              role,
              company.id,
              false
            );
            await User.update(
              {
                companyId: company.id
              },
              { where: { email: userData.email } }
            );
            res.status(200).send({ accessToken, user });
          });
        } else {
          Company.create({
            domain: company,
            isActive: 1,
            isPaid: 0
          }).then(async (company) => {
            // eslint-disable-next-line prefer-const
            let { accessToken, user } = await generateUser(
              userData,
              role,
              company.id,
              true
            );

            const today = new Date();
            const createdDate = today;

            const oneDay = 1000 * 60 * 60 * 24;
            const diffTime = Math.abs(today - createdDate);
            const passedDays = Math.ceil(diffTime / oneDay);
            const remainedDays = 15 - passedDays;
            const tmpExpDate = new Date(createdDate);
            const expiredDay = new Date(
              tmpExpDate.setDate(tmpExpDate.getDate() + 14)
            )
              .toISOString()
              .split('T')[0];

            Company.update(
              { planType: 'trial' },
              { where: { id: company.id } }
            );

            user = {
              ...user,
              isActive: 1,
              isPaid: 0,
              remainedDays,
              expiredDay,
              planType: 'trial'
            };
            await User.update(
              {
                companyId: company.id
              },
              { where: { email: userData.email } }
            );
            res.status(200).send({ accessToken, user });
          });
        }
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then((userData) => {
      if (!userData) {
        return res.status(400).send({ message: 'auth/user-not-found' });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        userData.password
      );

      if (!passwordIsValid) {
        return res.status(400).send({
          accessToken: null,
          message: 'auth/wrong-password'
        });
      }

      const token = jwt.sign(
        { userId: userData.id, companyId: userData.companyId },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN // 24 hours 86400
        }
      );

      const officeIds = [];
      const teamIds = [];
      userData.getOffices().then((offices) => {
        for (let i = 0; i < offices.length; i += 1) {
          officeIds.push(`${offices[i].id}`);
        }
        userData.getTeams().then((teams) => {
          for (let i = 0; i < teams.length; i += 1) {
            teamIds.push(`${teams[i].id}`);
          }

          if (userData.companyId === 1) {
            const user = {
              id: userData.id,
              firstname: userData.firstname,
              lastname: userData.lastname,
              email: userData.email,
              photoURL: userData.photoURL,
              prefferedname: userData.prefferedname,
              jobtitle: userData.jobtitle,
              departmentname: userData.departmentname,
              roles: ROLES[userData.roleId - 1].toUpperCase()
            };

            const accessToken = token;
            res.status(200).send({ accessToken, user });
          } else {
            Company.findOne({
              where: { id: userData.companyId }
            }).then((company) => {
              const today = new Date();
              const createdDate = company.createdAt;

              const oneDay = 1000 * 60 * 60 * 24;
              const diffTime = Math.abs(today - createdDate);
              const passedDays = Math.ceil(diffTime / oneDay);
              const remainedDays = 15 - passedDays;
              const tmpExpDate = new Date(createdDate);
              const expiredDay = new Date(
                tmpExpDate.setDate(tmpExpDate.getDate() + 14)
              )
                .toISOString()
                .split('T')[0];

              let planType = 'trial';

              if (company.isActive === 1) {
                if (company.isPaid === 1) {
                  planType = 'premium';
                } else if (remainedDays > 0) {
                  planType = 'trial';
                } else {
                  planType = 'free';
                }
              }

              if (company.isSetBySuper === 0) {
                planType = company.planType;
              } else {
                Company.update(
                  { planType },
                  { where: { id: userData.companyId } }
                );
              }

              const user = {
                id: userData.id,
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                photoURL: userData.photoURL,
                prefferedname: userData.prefferedname,
                jobtitle: userData.jobtitle,
                departmentname: userData.departmentname,
                roles: ROLES[userData.roleId - 1].toUpperCase(),
                offices: officeIds,
                teams: teamIds,
                companyId: userData.comapnyId,
                remainedDays,
                expiredDay,
                isActive: company.isActive,
                isPaid: company.isPaid,
                customerId: company.customerId,
                planType
              };

              const accessToken = token;
              res.status(200).send({ accessToken, user });
            });
          }
        });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.resetPassword = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { userId } = jwt.verify(accessToken, JWT_SECRET);

  User.findOne({
    where: {
      id: userId
    }
  }).then((userData) => {
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      userData.password
    );

    if (!passwordIsValid) {
      return res.status(400).send({
        accessToken: null,
        message: 'auth/wrong-password'
      });
    }

    User.update(
      { password: bcrypt.hashSync(req.body.newPassword, 8) },
      { where: { id: userId } }
    ).then(() => {
      res.status(200).send({ message: 'Password Changed successfully!' });
    });
  });
};

async function generateUser(userData, role, cId, isNew) {
  if (isNew) {
    await initial(cId, userData.id);
  }

  Calendar.create({
    schedule: JSON.stringify(SCHEDULES),
    userId: userData.id,
    companyId: cId
  });

  const accessToken = jwt.sign(
    { userId: userData.id, companyId: cId },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );

  const entries = await Office.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
    where: {
      companyId: cId,
      isActive: 1
    }
  });

  let officeId = '';
  entries.map((office) => {
    officeId = office.id;
  });

  const user = {
    id: userData.id,
    firstname: userData.firstname,
    lastname: userData.lastname,
    prefferedname: userData.prefferedname,
    jobtitle: userData.jobtitle,
    departmentname: userData.departmentname,
    email: userData.email,
    photoURL: userData.photoURL,
    roles: ROLES[role - 1].toUpperCase(),
    offices: [officeId],
    teams: [],
    customerId: null,
    companyId: cId
  };

  const sql = `
    UPDATE users
    SET roleId = ${role}
    WHERE id = ${userData.id};
  `;
  sequelize.query(sql, {
    type: sequelize.QueryTypes.UPDATE
  });

  // set user office
  userData.setOffices([officeId]).then(() => {
    const sql = `
      UPDATE user_offices
      SET isManager = 0
      WHERE userId = ${userData.id} and officeId = ${officeId};
    `;
    sequelize.query(sql, {
      type: sequelize.QueryTypes.UPDATE
    });
  });
  const res = {};
  res.accessToken = accessToken;
  res.user = user;
  return res;
}

async function initial(cId) {
  // user office initialize ...
  OFFICES.forEach((office) => {
    Office.create({
      emoji: office.emoji,
      name: office.name,
      capacity: office.capacity,
      companyId: cId
    });
  });

  TEAMS.forEach((team) => {
    Team.create({
      color: team.color,
      name: team.name,
      capacity: team.capacity,
      companyId: cId
    });
  });

  BASICLIST.forEach((basic) => {
    BasicList.create({
      emoji: basic.emoji,
      title: basic.title,
      description: basic.description,
      isActive: basic.isActive,
      companyId: cId
    });
  });

  CUSTOMLIST.forEach((custom) => {
    Customlist.create({
      emoji: custom.emoji,
      title: custom.title,
      isActive: custom.isActive,
      companyId: cId
    });
  });

  WorkingDays.create({
    isWorking: WORKINGDAYS,
    companyId: cId
  });

  Organizations.create({
    isEmail: ORGANIZATIONS.isEmail,
    isGoogleSignIn: ORGANIZATIONS.isGoogleSignIn,
    startingDay: ORGANIZATIONS.startingDay,
    monthRange: ORGANIZATIONS.monthRange,
    isCities: ORGANIZATIONS.isCities,
    isHalfDays: ORGANIZATIONS.isHalfDays,
    companyId: cId
  });
}
