const controller = require('../controllers/general.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // --------------------- Office Getting List section --------------------------------------------------------------

  app.get('/api/general/calendars', controller.getCalendar);
  app.get('/api/general/calendar-lists', controller.getCalendarList);
  app.get('/api/general/allstatus', controller.getAllUserStatusById);
  app.get('/api/general/allusers', controller.getUsersByCompany);

  // --------------------- Schedule update section --------------------------------------------------------------
  app.post('/api/general/updateSchedule', controller.updateSchedule);

  // --------------------- Invite emails section --------------------------------------------------------------
  app.post('/api/general/invite-emails', controller.inviteEmails);
  // -----------------------------------------------------------------------------------
};
