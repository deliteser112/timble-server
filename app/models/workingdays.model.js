module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define('workingdays', {
    isWorking: {
      type: Sequelize.STRING
    },
    companyId: {
      type: Sequelize.INTEGER
    }
  });

  return Role;
};
