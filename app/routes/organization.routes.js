const controller = require('../controllers/organization.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // --------------------- Organization Getting List section --------------------------------------------------------------

  app.get('/api/organization/organizations', controller.getOrganizations);

  // --------------------- Organization CRUD section --------------------------------------------------------------
  app.post('/api/organization/addCustomStatus', controller.addCustomStatus);
  app.post(
    '/api/organization/updateOrganizations',
    controller.updateOrganizations
  );
  // -----------------------------------------------------------------------------------
};
