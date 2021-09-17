module.exports = (sequelize, Sequelize) => {
  const Company = sequelize.define('companies', {
    name: {
      type: Sequelize.STRING
    },
    domain: {
      type: Sequelize.STRING
    },
    planType: {
      type: Sequelize.STRING
    },
    isActive: {
      type: Sequelize.INTEGER
    },
    isPaid: {
      type: Sequelize.INTEGER
    },
    customerId: {
      type: Sequelize.STRING
    },
    isSetBySuper: {
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

  return Company;
};
