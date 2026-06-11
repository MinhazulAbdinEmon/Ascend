import jwt from 'jsonwebtoken';

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // browser JS cannot read this cookie -> protects against XSS token theft
    secure: isProd, // HTTPS-only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' is required when frontend and API live on different domains
  };
};

// Sign a JWT containing the user's id and attach it as an HTTP-only cookie.
export const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie('token', token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', { ...cookieOptions(), expires: new Date(0) });
};
