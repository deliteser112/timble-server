const { verifySignUp } = require('../middleware');
const controller = require('../controllers/auth.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  app.post(
    '/api/auth/signup',
    [
      verifySignUp.checkBusinessEmail,
      verifySignUp.checkDuplicateEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post('/api/auth/signin', controller.signin);
  app.post('/api/auth/resetPasword', controller.resetPassword);
};
