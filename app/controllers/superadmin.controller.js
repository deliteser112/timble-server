/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */
const db = require('../models');

const Company = db.company;
const User = db.user;
const Office = db.office;
const Team = db.team;

const ADMIN = 2;

const { ROLES } = db;

exports.getCompanyList = (req, res) => {
  Company.findAll().then(async (companies) => {
    const CompanyList = await getCompanies(companies);
    CompanyList.shift();
    res.status(200).send(CompanyList);
  });
};

async function getCompanies(companies) {
  const asyncRes = await Promise.all(
    companies.map(async (company) => {
      const {
        id,
        name,
        domain,
        planType,
        isActive,
        isPaid,
        isSetBySuper
      } = company;
      if (id !== 1) {
        const users = await User.findAll({ where: { companyId: id } });
        const offices = await Office.findAll({ where: { companyId: id } });
        const teams = await Team.findAll({ where: { companyId: id } });
        let adminInfo = {};
        users.map((user) => {
          if (user.roleId === ADMIN) {
            adminInfo = user;
          }
        });
        const comObj = {
          id,
          name,
          domain,
          planType,
          isActive,
          isPaid,
          isSetBySuper,
          members: users.length,
          offices: offices.length,
          teams: teams.length,
          adminAvatar: adminInfo.photoURL,
          adminName: `${adminInfo.firstname} ${adminInfo.lastname}`,
          adminEmail: adminInfo.email
        };
        return comObj;
      }
    })
  );
  return asyncRes;
}

exports.getUserList = (req, res) => {
  User.findAll().then(async (users) => {
    const pUsers = [];
    users.map((user) => {
      if (user.companyId !== 1) {
        pUsers.push(user);
      }
    });
    const UserList = await getUsers(pUsers);
    res.status(200).send(UserList);
  });
};

async function getUsers(users) {
  const asyncRes = await Promise.all(
    users.map(async (user) => {
      const {
        id,
        firstname,
        lastname,
        email,
        photoURL,
        roleId,
        companyId
      } = user;
      const offices = await user.getOffices();
      const officeNames = [];
      offices.map((office) => {
        officeNames.push(office.emoji);
      });

      const teams = await user.getTeams();
      const teamNames = [];
      teams.map((team) => {
        teamNames.push({ name: team.name, color: team.color });
      });
      const companyInfo = await Company.findOne({ where: { id: companyId } });
      const companyName =
        companyInfo.name === null ? companyInfo.domain : companyInfo.name;
      const userObj = {
        id,
        name: `${firstname} ${lastname}`,
        email,
        roles: ROLES[roleId - 1],
        photoURL,
        offices: officeNames,
        teams: teamNames,
        companyName
      };
      return userObj;
    })
  );
  return asyncRes;
}

exports.updatePlan = (req, res) => {
  const { id, planType } = req.body;
  Company.update({ planType }, { where: { id } });
  res.status(200).send({ message: 'success' });
};

exports.updateIsManual = (req, res) => {
  const { id, isSetBySuper } = req.body;
  Company.update({ isSetBySuper }, { where: { id } });
  res.status(200).send({ message: 'success' });
};

exports.getInsightList = (req, res) => {
  Company.findAll().then((companies) => {
    const companyList = [];
    companies.map((company) => {
      if (company.id !== 1) {
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

        const comObj = {
          name: company.name,
          domain: company.domain,
          plans: company.planType,
          trialDays: remainedDays,
          endOn: expiredDay,
          isPaid: company.isPaid,
          passedDays
        };
        companyList.push(comObj);
      }
    });
    res.status(200).send(companyList);
  });
};
