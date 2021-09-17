module.exports = (sequelize, Sequelize) => {
  const Calendar = sequelize.define('calendars', {
    schedule: {
      type: Sequelize.TEXT
    },
    userId: {
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

  return Calendar;
};
