const {
  getProfile,
  updateProfile,
} = require('../services/profile.service');

// Get current user's profile
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: {
        user: profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update current user's profile
const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await updateProfile(
      req.user.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};