function compileTemplate(html, variables) {
  let compiled = html;
  for (const key in variables) {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  }
  return compiled;
}

const welcomeTemplate = '<h1>Welcome, {{name}}!</h1><p>Thanks for joining Xeno.</p>';

module.exports = { compileTemplate, welcomeTemplate };
