module.exports = (sequelize, Sequelize) => {
  const Organization = sequelize.define('organizations', {
    isEmail: {
      type: Sequelize.INTEGER
    },
    isGoogleSignIn: {
      type: Sequelize.INTEGER
    },
    startingDay: {
      type: Sequelize.INTEGER
    },
    monthRange: {
      type: Sequelize.INTEGER
    },
    isCities: {
      type: Sequelize.INTEGER
    },
    isHalfDays: {
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

  return Organization;
};
