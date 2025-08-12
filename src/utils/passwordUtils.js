import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export { hashPassword, verifyPassword };
