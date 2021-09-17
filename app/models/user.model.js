module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('users', {
    firstname: {
      type: Sequelize.STRING
    },
    lastname: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    prefferedname: {
      type: Sequelize.STRING
    },
    jobtitle: {
      type: Sequelize.STRING
    },
    departmentname: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    photoURL: {
      type: Sequelize.STRING
    },
    roleId: {
      type: Sequelize.INTEGER
    },
    companyId: {
      type: Sequelize.INTEGER
    },
    createdAt: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    },
    updatedAt: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  });

  return User;
};
