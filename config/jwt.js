function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be set and contain at least 32 bytes. Generate a unique secret and store it in the environment.');
  }
  return secret;
}

module.exports = { getJwtSecret };
