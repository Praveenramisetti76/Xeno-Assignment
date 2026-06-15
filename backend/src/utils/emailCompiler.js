function compileTemplate(html, variables) {
  let compiled = html;
  for (const key in variables) {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  }
  return compiled;
}

module.exports = { compileTemplate };
