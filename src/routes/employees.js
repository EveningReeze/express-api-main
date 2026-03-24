/* eslint-disable consistent-return */
const express = require('express');
const employeeController = require('../controllers/employeeController');
const schema = require('../db/schema');
const db = require('../db/connection');

// 获取 employees 集合的引用
const employees = db.get('employees');

const router = express.Router();
// 新的路由定义
router.get('/', employeeController.getAllEmployees);
router.get('/jobs/all', employeeController.getAllJobs);
router.get('/range', employeeController.getEmployeesInIdRange);
router.get('/range/paginated', employeeController.getEmployeesInIdRangePaginated);
router.get('/username/:username', employeeController.getEmployeeByUsername);
router.get('/id/:id', employeeController.getEmployeeById);
/* 获取所有员工 */
router.get('/', async (req, res, next) => {
  try {
    // 从数据库中查询所有员工记录
    const allEmployees = await employees.find({});
    // 以 JSON 格式返回员工数据
    res.json(allEmployees);
  } catch (error) {
    // 将错误传递给 Express 的错误处理中间件
    next(error);
  }
});

/* 渲染员工页面（使用 EJS 模板引擎） */
router.get('/view', async (req, res, next) => {
  try {
    // 从数据库中获取所有员工数据
    const allEmployees = await employees.find({});
    
    // 渲染 EJS 模板，将数据传递给视图
    res.render('employees', { 
      employees: allEmployees,           // 员工数据数组
      title: '员工列表',                  // 页面标题
      currentYear: new Date().getFullYear() // 当前年份（可用于版权信息）
    });
  } catch (error) {
    // 将错误传递给错误处理中间件
    next(error);
  }
});


/* 获取指定 ID 的员工 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params; // 从 URL 参数中获取员工 ID
    // 根据 ID 查询单个员工
    const employee = await employees.findOne({
      _id: id,
    });

    // 如果员工不存在，返回 404 错误
    if (!employee) {
      const error = new Error('Employee does not exist');
      return next(error);
    }

    // 返回员工数据
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

/* 创建新员工 */
router.post('/', async (req, res, next) => {
  try {
    const { name, job } = req.body; // 从请求体中获取姓名和职位
    // 验证数据格式是否符合 schema 要求
    await schema.validateAsync({ name, job });

    // 检查员工是否已存在（基于姓名）
    const employee = await employees.findOne({
      name,
    });

    // 如果员工已存在，返回 409 冲突错误
    if (employee) {
      const error = new Error('Employee already exists');
      res.status(409); // conflict error
      return next(error);
    }

    // 将新员工插入数据库
    const newuser = await employees.insert({
      name,
      job,
    });

    // 返回 201 创建成功状态码和新员工数据
    res.status(201).json(newuser);
  } catch (error) {
    next(error);
  }
});

/* 更新指定 ID 的员工信息 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params; // 从 URL 参数中获取员工 ID
    const { name, job } = req.body; // 从请求体中获取更新后的姓名和职位
    // 验证更新数据的格式
    const result = await schema.validateAsync({ name, job });
    
    // 检查要更新的员工是否存在
    const employee = await employees.findOne({
      _id: id,
    });

    // 如果员工不存在，返回 404 错误
    if (!employee) {
      return next();
    }

    // 更新员工信息，如果不存在则创建（upsert: true）
    const updatedEmployee = await employees.update({
      _id: id,
    }, { $set: result },
    { upsert: true });

    // 返回更新后的员工数据
    res.json(updatedEmployee);
  } catch (error) {
    next(error);
  }
});

/* 删除指定 ID 的员工 */
// 示例请求: DELETE /655afa8196943302b03283bd
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params; // 从 URL 参数中获取要删除的员工 ID
    // 检查要删除的员工是否存在
    const employee = await employees.findOne({
      _id: id,
    });

    // 如果员工不存在，返回 404 错误
    if (!employee) {
      return next();
    }
    
    // 从数据库中删除该员工
    await employees.remove({
      _id: id,
    });

    // 返回删除成功的消息
    res.json({
      message: 'Employee has been deleted',
    });
  } catch (error) {
    next(error);
  }
});

// 导出路由模块
module.exports = router;