/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */
const sendGridMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

sendGridMail.setApiKey(
  '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'
);

const config = require('../config/auth.config');

const JWT_SECRET = config.secret;

const db = require('../models');

const User = db.user;
const Calendar = db.calendar;
const Company = db.company;
const Organization = db.organizations;

const { ROLES, SCHEDULES } = db;
const MEMBER = 4;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, '../public/static/uploads');
  },
  filename(req, file, cb) {
    console.log(file);
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage }).single('file');

exports.getUserList = (req, res) => {
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
    const officeIds = [];
    userData.getOffices().then((offices) => {
      for (let i = 0; i < offices.length; i += 1) {
        officeIds.push(`${offices[i].id}`);
      }
      const user = {
        id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        photoURL: userData.photoURL,
        roles: ROLES[userData.roleId - 1].toUpperCase(),
        offices: officeIds
      };
      User.findAll().then((datas) => {
        getUserLists(datas).then((users) => {
          const existEmail = user.email.split('@')[1].split('.')[0];
          const isAdmin = user.roles === 'ADMIN';
          const members = [];
          users.map((res) => {
            const reqEmail = res.email.split('@')[1].split('.')[0];
            if (isAdmin) {
              if (existEmail === reqEmail) members.push(res);
            } else if (existEmail === reqEmail) {
              let isDuplicated = false;
              for (let i = 0; i < res.officeIds.length; i += 1) {
                if (isDuplicated) {
                  isDuplicated = false;
                  break;
                }
                for (let j = 0; j < user.offices.length; j += 1) {
                  if (res.officeIds[i] === user.offices[j]) {
                    isDuplicated = true;
                    members.push(res);
                    break;
                  }
                }
              }
            }
          });
          res.status(200).send(members);
        });
      });
    });
  });
};

async function getUserLists(datas) {
  const users = [];
  for (let i = 0; i < datas.length; i += 1) {
    const offices = await datas[i].getOffices();
    const officeIds = [];
    for (let i = 0; i < offices.length; i += 1) {
      officeIds.push(`${offices[i].id}`);
    }
    const teams = await datas[i].getTeams();
    const teamIds = [];
    for (let i = 0; i < teams.length; i += 1) {
      teamIds.push(`${teams[i].id}`);
    }

    users.push({
      id: datas[i].id,
      photoURL: datas[i].photoURL,
      firstname: datas[i].firstname,
      lastname: datas[i].lastname,
      name: `${datas[i].firstname} ${datas[i].lastname}`,
      email: datas[i].email,
      role: ROLES[datas[i].roleId - 1],
      isLinked: false,
      departmentname: datas[i].departmentname,
      jobtitle: datas[i].jobtitle,
      prefferedname: datas[i].prefferedname,
      offices: officeIds,
      teams: teamIds,
      officeIds,
      teamIds
    });
  }
  return users;
}

exports.updateProfile = (req, res) => {
  User.update(
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      photoURL: req.body.photoURL,
      prefferedname: req.body.prefferedname,
      jobtitle: req.body.jobtitle,
      departmentname: req.body.departmentname,
      roles: 1
    },
    { where: { email: req.body.email } }
  )
    .then(() => {
      User.findOne({
        where: {
          email: req.body.email
        }
      }).then((userData) => {
        userData.setOffices(req.body.officeId);
        userData.setTeams(req.body.teamId);
        res.status(200).send('success');
      });
    })
    .catch((error) => {
      console.log('error', error);
    });
};

exports.uploadAvatar = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    }
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
};

exports.getProfile = (req, res) => {
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
            Company.update({ planType }, { where: { id: userData.companyId } });
          }

          if (planType === 'free') {
            Organization.update(
              { isHalfDays: 0 },
              { where: { companyId: userData.companyId } }
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
            companyId: userData.companyId,
            remainedDays,
            expiredDay,
            isActive: company.isActive,
            isPaid: company.isPaid,
            customerId: company.customerId,
            planType
          };

          res.status(200).send({ user });
        });
      });
    });
  });
};

exports.addMemberList = async (req, res) => {
  const memberList = req.body;
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);

  const role = MEMBER;

  const sendingEmails = await addMembers(memberList, role, companyId);

  if (sendingEmails.length > 0) {
    const domain = sendingEmails[0].split('@')[1];
    await sendEmail(sendingEmails, domain);
    res.status(200).send({ message: 'success' });
  }
};

exports.makeAdmin = (req, res) => {
  const { userId } = req.body;
  User.findOne({ where: { id: userId } }).then((user) => {
    const { roleId } = user;
    let role = 0;
    role = roleId === 2 ? 4 : 2;
    User.update({ roleId: role }, { where: { id: userId } });
  });
  res.status(200).send('success');
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.body;
  await User.destroy({ where: { id: userId } });
  res.status(200).send('success');
};

async function addMembers(memberList, role, companyId) {
  const asyncRes = await Promise.all(
    memberList.map(async (member) => {
      const userData = await User.findOne({ where: { email: member.email } });
      if (userData === null) {
        const userInfo = await User.create({
          firstname: member.firstname === null ? '' : member.firstname,
          lastname: member.lastname === null ? '' : member.lastname,
          prefferedname:
            member.prefferedname === null ? '' : member.prefferedname,
          jobtitle: member.jobtitle === null ? '' : member.jobtitle,
          email: member.email,
          departmentname:
            member.departmentname === null ? '' : member.departmentname,
          photoURL: '/static/uploads/1.jpg',
          password: bcrypt.hashSync('thimble1234', 8),
          roleId: role,
          companyId
        });
        const { officeIds, teamIds } = getIds(member);
        await generateUser(userInfo, companyId, officeIds, teamIds);
        return member.email;
      }
    })
  );
  return asyncRes;
}

async function generateUser(userData, cId, officeIds, teamIds) {
  Calendar.create({
    schedule: JSON.stringify(SCHEDULES),
    // userId: userData.id,
    companyId: cId
  });

  // set user office
  await userData.setOffices(officeIds);
  await userData.setTeams(teamIds);
}

function getIds(member) {
  const officeIds = [];
  if (member.offices !== null) {
    if (typeof member.offices === 'number') {
      officeIds.push(member.offices);
    } else {
      const tmpOffices = member.offices.split(',');
      tmpOffices.map((office) => {
        officeIds.push(Number(office));
      });
    }
  }

  const teamIds = [];
  if (member.teams !== null) {
    if (typeof member.teams === 'number') {
      teamIds.push(member.teams);
    } else {
      const tmpTeams = member.teams.split(',');
      tmpTeams.map((team) => {
        teamIds.push(Number(team));
      });
    }
  }
  const resData = {};
  resData.officeIds = officeIds;
  resData.teamIds = teamIds;
  return resData;
}

function getMessage(emails, domain) {
  const body = `<h3>Welcome to Thimble, please click <a href='http://localhost:3000/auth/login'>here</a> to register and join <br> your colleagues from the company ${domain}</h3>`;
  return {
    to: emails,
    from: 'm.bengoufa@gmail.com',
    subject: 'Join to Thimble',
    text: body,
    html: `<div style='text-align: center;'><div><img src='https://escribers.team/assets/img/recruitment.jpg' /></div>${body}<div> Password: thimble1234 </div></div>`
  };
}

async function sendEmail(emails, domain) {
  try {
    await sendGridMail.send(getMessage(emails, domain));
  } catch (error) {
    console.error('Error sending test email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}
