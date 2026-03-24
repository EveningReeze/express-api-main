// controllers/employeeController.js
const db = require('../db/connection');
const employees = db.get('employees');

/**
 * 获取所有用户
 * GET /api/employees
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const allEmployees = await employees.find({});
    res.json({
      success: true,
      count: allEmployees.length,
      data: allEmployees
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取具有相应用户名的用户
 * GET /api/employees/username/:username
 */
const getEmployeeByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // 使用正则表达式进行不区分大小写的用户名搜索
    const employee = await employees.findOne({
      name: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `User with username '${username}' not found`
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取具有相应 _id 的用户
 * GET /api/employees/id/:id
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await employees.findOne({
      _id: id
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `User with ID '${id}' not found`
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    // 处理无效的 MongoDB ID 格式错误
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    next(error);
  }
};

/**
 * 获取数据库中存在的所有职位
 * GET /api/employees/jobs/all
 */
const getAllJobs = async (req, res, next) => {
  try {
    // 使用聚合管道获取所有唯一的职位
    const jobs = await employees.distinct('job');
    
    // 过滤掉空值或未定义的职位
    const validJobs = jobs.filter(job => job && job.trim() !== '');
    
    // 获取每个职位的员工数量统计
    const jobStats = await employees.aggregate([
      { $match: { job: { $exists: true, $ne: null, $ne: '' } } },
      { $group: {
          _id: '$job',
          count: { $sum: 1 },
          employees: { $push: { name: '$name', _id: '$_id' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      totalJobs: validJobs.length,
      jobs: validJobs,
      jobStatistics: jobStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取 ID 在给定范围内的用户
 * GET /api/employees/range?start=id1&end=id2
 * 注意：MongoDB ObjectId 是基于时间的，所以范围查询是有意义的
 */
const getEmployeesInIdRange = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    // 验证查询参数
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start and end ID parameters'
      });
    }

    // 验证 ID 格式（可选，但推荐）
    const idRegex = /^[0-9a-fA-F]{24}$/;
    if (!idRegex.test(start) || !idRegex.test(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. IDs must be 24 character hex strings'
      });
    }

    // MongoDB 的 ObjectId 可以进行比较，因为它们是按时间排序的
    const employeesInRange = await employees.find({
      $and: [
        { _id: { $gte: start } },  // 大于等于 start
        { _id: { $lte: end } }      // 小于等于 end
      ]
    });

    res.json({
      success: true,
      range: {
        start,
        end
      },
      count: employeesInRange.length,
      data: employeesInRange
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 增强版：获取 ID 在给定范围内的用户（支持分页和排序）
 * GET /api/employees/range/paginated?start=id1&end=id2&page=1&limit=10&sort=asc
 */
const getEmployeesInIdRangePaginated = async (req, res, next) => {
  try {
    const { 
      start, 
      end, 
      page = 1, 
      limit = 10,
      sort = 'asc' 
    } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both start and end ID parameters'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询
    const query = {
      $and: [
        { _id: { $gte: start } },
        { _id: { $lte: end } }
      ]
    };

    // 获取总数
    const total = await employees.count(query);

    // 获取分页数据
    const employeesInRange = await employees.find(query, {
      limit: limitNum,
      skip: skip,
      sort: { _id: sort === 'asc' ? 1 : -1 }
    });

    res.json({
      success: true,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      range: {
        start,
        end
      },
      data: employeesInRange
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeByUsername,
  getEmployeeById,
  getAllJobs,
  getEmployeesInIdRange,
  getEmployeesInIdRangePaginated
};