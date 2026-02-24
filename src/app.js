const express = require('express');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path'); // 添加这行
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares');

const app = express();
 
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());

const employees = require('./routes/employees');

// 设置视图引擎和视图目录
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // 设置视图目录为 src/views

app.use('/api/employees', employees);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
