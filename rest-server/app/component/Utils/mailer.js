'use strict';
const nodemailer = require('nodemailer');

const defaultMailerOptions = {
  // do not fail on invalid certs
  tls:{
    rejectUnauthorized: false
  }
}

// options = {
//   host: 'smtp.ethereal.email',
//     port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//   user: testAccount.user, // generated ethereal user
//     pass: testAccount.pass // generated ethereal password
// }
// }
async function createMailer(options){
  const opts = Object.assign({},defaultMailerOptions,options)
  const transporter = nodemailer.createTransport(opts);
  return new Promise((resolve, reject)=>{
    transporter.verify(function(error, success) {
      if (error) {
        reject(error);
      } else {
        resolve(transporter);
      }
    });
  })
}

module.exports = {createMailer};