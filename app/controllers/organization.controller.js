/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */
const jwt = require('jsonwebtoken');
const db = require('../models');

const Company = db.company;
const BasicList = db.basiclist;
const CustomList = db.customlist;
const WorkingDays = db.workingdays;
const Organizations = db.organizations;

const config = require('../config/auth.config');

const JWT_SECRET = config.secret;

exports.getOrganizations = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);

  let company = {};
  let calendar = {};
  let features = {};
  let statuses = {};
  const workDayInfo = [];

  // featching the data;
  const companyInfo = await Company.findOne({ where: { id: companyId } });
  const orgInfo = await Organizations.findOne({
    where: { companyId }
  });
  let workingDaysInfo = await WorkingDays.findOne({
    where: { companyId }
  });

  workingDaysInfo = workingDaysInfo.isWorking.split(',');

  workingDaysInfo.map((item) => {
    workDayInfo.push(Number(item));
  });

  const basicListInfo = await BasicList.findAll({ where: { companyId } });
  const customListInfo = await CustomList.findAll({ where: { companyId } });
  Company.findOne({ where: { id: companyId } }).then((com) => {
    const plan = com.planType;
    let limits = 0;
    if (plan === 'free') {
      limits = 2;
    } else {
      limits = customListInfo.length;
    }

    const basicInfo = [];
    const customInfo = [];
    basicListInfo.map((item) => {
      basicInfo.push({
        id: item.id,
        emoji: item.emoji,
        title: item.title,
        description: item.description,
        isActive: item.isActive
      });
    });

    customListInfo.map((item, index) => {
      if (index < limits) {
        customInfo.push({
          id: item.id,
          emoji: item.emoji,
          title: item.title,
          isActive: item.isActive
        });
      }
    });

    company = {
      name: companyInfo.name,
      domain: companyInfo.domain,
      isEmail: orgInfo.isEmail,
      isGoogleSignIn: orgInfo.isGoogleSignIn
    };

    calendar = {
      startingDay: orgInfo.startingDay,
      monthRange: orgInfo.monthRange,
      workDays: workDayInfo
    };

    features = {
      isHalfDays: orgInfo.isHalfDays,
      isCities: orgInfo.isCities
    };

    statuses = {
      basicList: basicInfo,
      customList: customInfo
    };

    const result = { company, calendar, features, statuses };
    res.status(200).send({ result });
  });
};

exports.addCustomStatus = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);

  CustomList.create({
    emoji: '🙂',
    title: 'New Custom',
    isActive: 0,
    companyId
  }).then((customList) => {
    const data = {
      id: customList.id
    };
    res.status(200).send(data);
  });
};

exports.updateOrganizations = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  const { company, calendar, features, statuses } = req.body;

  await Company.update(
    {
      name: company.name,
      domain: company.domain
    },
    { where: { id: companyId } }
  );

  await Organizations.update(
    {
      isEmail: company.isEmail,
      isGoogleSignIn: company.isGoogleSignIn,
      startingDay: calendar.startingDay,
      monthRange: calendar.monthRange,
      isHalfDays: features.isHalfDays,
      isCities: features.isCities
    },
    { where: { companyId } }
  );
  const ids = calendar.workDays.toString();
  await WorkingDays.update({ isWorking: ids }, { where: { companyId } });

  const { basicList, customList } = statuses;

  basicList.map(async (item) => {
    await BasicList.update(
      {
        emoji: item.emoji,
        title: item.title,
        description: item.description,
        isActive: item.isActive
      },
      { where: { id: item.id } }
    );
  });

  customList.map(async (item) => {
    await CustomList.update(
      {
        emoji: item.emoji,
        title: item.title,
        isActive: item.isActive
      },
      { where: { id: item.id } }
    );
  });
  res.status(200).send('success');
};
