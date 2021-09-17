module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define('offices', {
    emoji: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    },
    capacity: {
      type: Sequelize.INTEGER.UNSIGNED
    },
    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1
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
