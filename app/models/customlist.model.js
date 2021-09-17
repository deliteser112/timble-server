module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define('customlists', {
    emoji: {
      type: Sequelize.STRING
    },
    title: {
      type: Sequelize.STRING
    },
    isActive: {
      type: Sequelize.INTEGER.UNSIGNED
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

  return Role;
};
