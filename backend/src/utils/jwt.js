const jwtMock = {
  sign: (payload, secret, options) => {
    const tokenPayload = { ...payload, exp: Date.now() + 3600000 };
    return 'mock_jwt_token_' + Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  },
  verify: (token, secret) => {
    if (!token.startsWith('mock_jwt_token_')) throw new Error('Invalid Token');
    const base64 = token.replace('mock_jwt_token_', '');
    const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('ascii'));
    if (decoded.exp < Date.now()) throw new Error('Token Expired');
    return decoded;
  }
};

function generateToken(user, secret, expiresIn = '1h') {
  return jwtMock.sign({ id: user.id, role: user.role }, secret, { expiresIn });
}

function verifyToken(token, secret) {
  return jwtMock.verify(token, secret);
}

module.exports = { generateToken, verifyToken };
