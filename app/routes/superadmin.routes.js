const controller = require('../controllers/superadmin.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // --------------------- Super admin Getting List section --------------------------------------------------------------

  app.get('/api/superadmin/companies', controller.getCompanyList);
  app.get('/api/superadmin/allusers', controller.getUserList);
  app.get('/api/superadmin/insights', controller.getInsightList);

  // --------------------- Super admin Setting List section --------------------------------------------------------------
  app.post('/api/superadmin/updatePlan', controller.updatePlan);
  app.post('/api/superadmin/updateIsManual', controller.updateIsManual);
};
