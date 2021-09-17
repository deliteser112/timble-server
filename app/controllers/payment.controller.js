// eslint-disable-next-line import/no-unresolved
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(
  'sk_test_51JHslQCFw0qPn0BMhmq0zrTd6vkfrOQgUcgR28kGWIGet0DO3fqf5Pwq2AGw2ubT0zZKBTEC8VRAVnvissilTaKw00LgOkBcCn'
);

const express = require('express');

const db = require('../models');

const User = db.user;
const Company = db.company;

const config = require('../config/auth.config');

const JWT_SECRET = config.secret;
const PRODUCT_ID = 'prod_JyUdW7gAbi9ig4';

const app = express();
app.use(express.static('.'));

const YOUR_DOMAIN = 'http://localhost:3000';

exports.createCheckoutSession = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { userId, companyId } = jwt.verify(accessToken, JWT_SECRET);

  const { email } = await User.findOne({ where: { id: userId } });

  const { payData } = req.body;

  let amount = 0;
  let interval = 'month';

  const { trialEnd, quantity, plan } = payData;

  if (plan === 'monthly') {
    amount = 7 * 100;
    interval = 'month';
  } else if (plan === 'yearly') {
    amount = 60 * 100;
    interval = 'year';
  }

  const price = await stripe.prices.create({
    product: PRODUCT_ID,
    unit_amount: amount,
    currency: 'usd',
    recurring: {
      interval
    }
  });

  const priceId = price.id;

  const customer = await stripe.customers.create({
    email,
    payment_method: 'pm_card_visa',
    invoice_settings: {
      default_payment_method: 'pm_card_visa'
    }
  });

  const customerId = customer.id;

  await Company.update({ customerId }, { where: { id: companyId } });

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    subscription_data: {
      trial_period_days: trialEnd
    },
    line_items: [
      {
        // TODO: replace this with the `price` of the product you want to sell
        price: priceId,
        quantity
      }
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: `${YOUR_DOMAIN}/dashboard/plans/${customerId}`,
    cancel_url: `${YOUR_DOMAIN}/dashboard/plans`
  });
  // res.redirect(303, session.url);

  res.status(200).send({ url: session.url });
};

exports.updatePaidStatus = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send([]);
  }

  const accessToken = authorization.split(' ')[1];
  const { companyId } = jwt.verify(accessToken, JWT_SECRET);
  const { payData } = req.body;
  const { planType, isPaid } = payData;
  await Company.update({ planType, isPaid }, { where: { id: companyId } });
  res.status(200).send({ message: 'success' });
};
