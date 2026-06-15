const jwtMock = {
  sign: (payload, secret, options) => {
    return 'mock_jwt_token_' + Buffer.from(JSON.stringify(payload)).toString('base64');
  },
  verify: (token, secret) => {
    if (!token.startsWith('mock_jwt_token_')) throw new Error('Invalid Token');
    const base64 = token.replace('mock_jwt_token_', '');
    return JSON.parse(Buffer.from(base64, 'base64').toString('ascii'));
  }
};

function generateToken(user, secret, expiresIn = '1h') {
  return jwtMock.sign({ id: user.id, role: user.role }, secret, { expiresIn });
}

function verifyToken(token, secret) {
  return jwtMock.verify(token, secret);
}

module.exports = { generateToken, verifyToken };
