const mockJoi = {
  validate: (data) => {
    if (!data.email) return { error: { details: [{ message: 'Email is required' }] } };
    if (!data.password) return { error: { details: [{ message: 'Password is required' }] } };
    return { error: null };
  }
};

const loginSchemaMock = {
  validate: (data) => {
    if (!data.email) return { error: { details: [{ message: 'Email is required' }] } };
    return { error: null };
  }
};

function validateBody(schema = mockJoi) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}

module.exports = { validateBody, loginSchemaMock };
