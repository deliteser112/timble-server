/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */
const sendGridMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const db = require('../models');

sendGridMail.setApiKey(
  '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'
);

const Calendar = db.calendar;
const User = db.user;
const config = require('../config/auth.config');
// const { user } = require('../models');

const JWT_SECRET = config.secret;

exports.getCalendar = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { userId } = jwt.verify(accessToken, JWT_SECRET);
  Calendar.findOne({
    where: { userId }
  }).then((calendar) => {
    res.status(200).send(JSON.parse(calendar.schedule));
  });
};

exports.getCalendarList = (req, res) => {
  Calendar.findAll().then((calendars) => {
    const calendarList = [];
    calendars.map((calendar) => {
      const { id, schedule, userId } = calendar;
      const sch = JSON.parse(schedule);
      calendarList.push({ id, sch, userId });
    });
    res.status(200).send(calendarList);
  });
};

exports.getAllUserStatusById = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  Calendar.findAll({
    where: { companyId }
  }).then((calendars) => {
    const resData = [];
    calendars.map((calendar) => {
      const resObj = {
        userId: calendar.userId,
        schedule: JSON.parse(calendar.schedule)
      };
      resData.push(resObj);
    });
    res.status(200).send(resData);
  });
};

exports.getUsersByCompany = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  User.findAll({
    where: { companyId }
  }).then(async (users) => {
    const resData = await getUsers(users);
    res.status(200).send(resData);
  });
};

exports.updateSchedule = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { userId } = jwt.verify(accessToken, JWT_SECRET);
  Calendar.findOne({
    where: { userId }
  }).then((calendar) => {
    const tmpSchedule = JSON.parse(calendar.schedule);
    const updatedSchedule = req.body;
    const schedule = tmpSchedule;
    tmpSchedule.map((months, mIndex) => {
      if (mIndex === updatedSchedule.month) {
        months.map((days, dIndex) => {
          if (dIndex === updatedSchedule.day) {
            const d = {
              icon: updatedSchedule.emoji,
              morning: updatedSchedule.morning,
              afternoon: updatedSchedule.afternoon,
              isHalf: updatedSchedule.isHalf,
              isWork: updatedSchedule.isWork
            };
            schedule[mIndex][dIndex] = d;
          }
        });
      }
    });
    const updatedData = JSON.stringify(schedule);
    Calendar.update(
      {
        schedule: updatedData
      },
      { where: { userId } }
    ).then(() => {
      res.status(200).send('success');
    });
  });
};

exports.inviteEmails = async (req, res) => {
  const data = req.body;
  const emails = [];
  data.map((email) => {
    emails.push(email.email);
  });
  if (emails.length > 0) {
    const domain = emails[0].split('@')[1];
    await sendEmail(emails, domain);
    res.status(200).send({ message: 'success' });
  }
};

async function getUsers(users) {
  const resData = [];
  for (let i = 0; i < users.length; i += 1) {
    const teams = await users[i].getTeams();
    const teamIds = [];
    teams.map((team) => {
      teamIds.push(team.id);
    });
    const userObj = {
      id: users[i].id,
      photoURL: users[i].photoURL,
      name: `${users[i].firstname} ${users[i].lastname}`,
      teamIds
    };
    resData.push(userObj);
  }
  return resData;
}

function getMessage(emails, domain) {
  const body = `<h3>Welcome to Thimble, please click <a href='http://localhost:3000/auth/login'>here</a> to register and join <br> your colleagues from the company ${domain}</h3>`;
  return {
    to: emails,
    from: 'm.bengoufa@gmail.com',
    subject: 'Join to Thimble',
    text: body,
    html: `<div style='text-align: center;'><div><img src='https://escribers.team/assets/img/recruitment.jpg' /></div>${body}</div>`
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
