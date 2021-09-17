const controller = require('../controllers/user.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  app.get('/api/user/manage-users', controller.getUserList);
  app.get('/api/user/profile', controller.getProfile);

  // -----------------------------------------------------------------------------------

  app.post('/api/user/updateProfile', controller.updateProfile);
  app.post('/api/user/uploadAvatar', controller.uploadAvatar);

  // -----------------------------------------------------------------------------------
  app.post('/api/user/addMemberList', controller.addMemberList);
  app.post('/api/user/make-admin', controller.makeAdmin);
  app.post('/api/user/delete-user', controller.deleteUser);
};
