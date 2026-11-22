
const {
  createUser,
  loginUser,
  changePassword,
} = require('../services/auth.service');

// Register a new user
const register = async (req, res, next) => {
  try {
    const user = await createUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login an existing user
const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Change the authenticated user's password
const changeUserPassword = async (req, res, next) => {
  try {
    await changePassword({
      userId: req.user.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  changeUserPassword,
};
