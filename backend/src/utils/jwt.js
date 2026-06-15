const jwtMock = {
  sign: (payload, secret, options) => {
    return 'mock_jwt_token_' + Buffer.from(JSON.stringify(payload)).toString('base64');
  }
};

function generateToken(user, secret, expiresIn = '1h') {
  return jwtMock.sign({ id: user.id, role: user.role }, secret, { expiresIn });
}

module.exports = { generateToken };
