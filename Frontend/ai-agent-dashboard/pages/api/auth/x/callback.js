const handler = require('../../../../backend/api/auth/x/callback.js');

export default function callback(req, res) {
  return handler(req, res);
}
