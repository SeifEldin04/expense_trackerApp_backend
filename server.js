const express = require('express');
const app = express();
const cors = require('cors')

require('dotenv').config();
app.use(cors("*"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Main route
const routes = require('./routes/index.js');
app.use('/api', routes);

// console.log("JWT_SECRET_KEY:", process.env.JWT_SECRET_KEY);-

app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Welcome To Expense Tracker Backend Server!' });
});

// handler for invalid API routing
app.all('*', (req, resp, next) => {
  return resp.status(500).json({ ststus: httpStatusText.ERROR, message: 'This resource is not available', code: 500 })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
