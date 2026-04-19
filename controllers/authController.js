const authService = require('../services/authService');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, email, and password are required.'
        }
      });
    }

    const user = await authService.registerUser({ name, email, password });

    return res.status(201).json({
      data: {
        _id: user._id,
        email: user.email,
        createdAt: user.createdAt
      },
      message: 'Account created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'email and password are required.'
        }
      });
    }

    const user = await authService.loginUser({ email, password });

    return res.status(200).json({
      data: {
        _id: user._id,
        email: user.email
      },
      message: 'Login successful.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser
};