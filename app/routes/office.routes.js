const controller = require('../controllers/office.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // --------------------- Office Getting List section --------------------------------------------------------------

  app.get('/api/office/offices', controller.getOfficeList);
  app.get('/api/office/office-managers', controller.getManagerList);

  // --------------------- Office CRUD section --------------------------------------------------------------
  app.post('/api/office/addOffice', controller.addOffice);
  app.post('/api/office/deleteOffice', controller.deleteOffice);
  app.post('/api/office/updateOfficeList', controller.updateOfficeList);
  // -----------------------------------------------------------------------------------
};
