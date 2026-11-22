
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required.');
  } else if (name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }

    if (email.trim().length > 255) {
      errors.push('Email must not exceed 255 characters.');
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (password.length > 72) {
    errors.push('Password must not exceed 72 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

// Validate password change requests
const validateChangePassword = (req, res, next) => {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = req.body || {};

  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string') {
    errors.push('New password is required.');
  } else if (newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  } else if (newPassword.length > 72) {
    errors.push('New password must not exceed 72 characters.');
  }

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push('Please confirm your new password.');
  } else if (
    typeof newPassword === 'string' &&
    newPassword !== confirmPassword
  ) {
    errors.push('New password and confirmation do not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
};
