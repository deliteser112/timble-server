const controller = require('../controllers/payment.controller');

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // --------------------- Payment checkout section --------------------------------------------------------------
  app.post(
    '/api/payment/create-checkout-session',
    controller.createCheckoutSession
  );
  app.post('/api/payment/update-paid-status', controller.updatePaidStatus);
  // -----------------------------------------------------------------------------------
};
