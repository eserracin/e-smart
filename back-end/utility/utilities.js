const Ol = require("../models/ol");
const nodemailer = require("nodemailer");
const fs = require("fs");
const Handlebars = require("handlebars");
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
const sslCertificate = require("get-ssl-certificate");
const jsSHA = require("jssha")

const HASH_KEY  = 'B04n3r$38T7un%3-'

exports.getTranName = skill => {
  return skill.trim().replace(/\s+/g, " ");
};

exports.getError = (req, res, error, others) => {
  if (error) this.returnError(req, res, error, others);
};

exports.arrayFunction = (data, objet) => {
  return new Promise((resolve, reject) => {
    var tempArray = [];
    data.forEach((item, index, array) => {
      tempArray.push(item[objet]);
      if (index === array.length - 1) resolve(tempArray);
    });
    reject();
  });
};

exports.saveLogs = (req, data) => {
  return new Promise(async (resolve, reject) => {
      if(data.error) console.log(data.error)
      let request_ip = (req.headers) ? req.headers["x-forwarded-for"] || req.connection.remoteAddress : null
      let module = req.module || data.module

      data.error = (data.error && typeof data.error === "object")?
        JSON.stringify(data.error):data.error
      data.details = (data.details && typeof data.details === "object")?
        JSON.stringify(data.details):data.details
      data.inputs = (data.inputs && typeof data.inputs === "object")?
        JSON.stringify(data.inputs):data.inputs

      const bodyRequest = {
        body: {
          detailsTables: data.details || req.get('User-Agent'),
          error: data.error,
          inputs: data.inputs,
          label: data.label,
          olTraceid: data.ol_traceid,
          module,
          platform: "CUS",
          reqId: req.id,
          requestIp: request_ip,
          time: Date.now() - req.start,
          type: "SER",
          urlSp: req.originalUrl,
          userSource: req.user.ccbpId
        },
        method: "put",
        resource: "/ccb-portal-api/api/v1/service-logs/"
      }
      this.print('----saveLogs----')
      this.print(bodyRequest)
      try{
        await Ol.makeRequest(bodyRequest)
        resolve()
      }catch(err) {
        console.log(err); reject(err)
      }
  })
}

exports.returnError = (
  req,
  res,
  error,
  others,
  isLog = true,
  msg = "Se encontró un error intentando procesar o recuperar la información."
) => {
  // const ol_traceid = (others != null)?others.ol_traceid:null
  // this.saveLogs(req, {
  //     ...others,
  //     ol_traceid,
  //     inputs: {
  //         params: req.params,
  //         body: req.body
  //     },
  //     label: 'SERVICE_ERROR',
  //     error
  // }).then(() => responseError(req, res, error, msg))
  // .catch(() => responseError(req, res, error, msg))
  if (isLog) {
    const ol_traceid = (others != null)?others.ol_traceid:null
    this.saveLogs(req, {
      ...others,
      ol_traceid,
      inputs: {
          params: req.params,
          body: req.body
      },
      label: 'SERVICE_ERROR'
    }).then(() => responseError(req, res, error, msg))
    .catch(() => responseError(req, res, error, msg))
  } else {
    responseError(req, res, error, msg);
  }
};

exports.returnData = (
  req,
  res,
  data,
  others,
  isLog = false,
  msg = "Información recuperada exitosamente."
) => {
  if (isLog) {
    const ol_traceid = (data != null)?data.ol_traceid:null
    this.saveLogs(req, {
      ...others,
      ol_traceid,
      inputs: {
          params: req.params,
          body: req.body
      },
      label: 'SERVICE'
    }).then(() => responseData(req, res, data, msg))
    .catch(() => responseData(req, res, data, msg))
  } else {
    responseData(req, res, data);
  }
};

const responseData = (req, res, data, msg) => {
  setTimeout(() => {
    if (data == null)
      res.json({
        success: true,
        message: msg,
        request_id: req.id
      });
    else
      res.json({
        success: true,
        message: msg,
        data,
        request_id: req.id
      });
  }, 0);
};

const responseError = (req, res, error, msg) => {
  res.status(400);
  res.json({
    success: false,
    message: msg,
    error,
    request_id: req.id
  });
};

exports.sendEmail = (reqId, toEmail, subject, templateName, paramsEmail, withLogo) => {
  return new Promise(async (resolve, reject) => {
    let transporter = null;

    if(process.env.APP_ENV == 'dev') {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      });
    }

    const templatePath =
      process.env.GLOBAL_DIR +
        "/resources/emails/templates/" +
        templateName +
        ".html";

    const imagePath =
      process.env.GLOBAL_DIR + "/resources/emails/templates/images/";

    try {
      let source = await fs.readFileSync(templatePath);
      let template = Handlebars.compile(source.toString());
      template = template(paramsEmail);

      let resultArray = [];
      let mailOptions = {}

      if(withLogo){
        mailOptions = {
          from: process.env.SMTP_USERNAME,
          to: toEmail,
          subject: subject,
          html: template,
          attachments: [
            {
              filename: "logo_ccb.png",
              path: imagePath + "logo_ccb.png",
              cid: "logo"
            }
          ]
        };
      }else{
        mailOptions = {
          from: process.env.SMTP_USERNAME,
          to: toEmail,
          subject: subject,
          html: template
        };
      }


      let result = await transporter.sendMail(mailOptions);

      resultArray.push({
        result: "Message sent: " + result.messageId
      });

      resolve(resultArray);
    } catch (err) {
      console.log(err);
      reject({
        result: "Error",
        error: err
      });
    }
  });
};

exports.encrypt = (text) =>{
  let iv = Buffer.from(process.env.ENCRYPT_IV, 'hex');
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPT_SECRETKEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return encrypted.toString('hex');
}
   
exports.decrypt = (text) =>{
  let iv = Buffer.from(process.env.ENCRYPT_IV, 'hex');
  let encryptedText = Buffer.from(text, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPT_SECRETKEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

exports.sslAllCertificateExpiration = async (req, res) => {
  const { data } = req.body;

  const response = await callCerticates(data);
  // console.log(response);
  res.json({
    success: true,
    message: "Información recuperada exitosamente.",
    data: {
      response
    }
  });
};

const callCerticates = async rows => {
  let listData = [];
  let result = "Error SSL";
  for (obj of rows) {
    try {
      result = await GetCerticate(obj.newurl);
    } catch (error) {
      // console.log(error);
    }
    const newdata = {
      ...obj,
      expiration: result
    };
    listData.push(newdata);
  }
  return listData;
};

function GetCerticate(url) {
  return sslCertificate.get(url, 1000, 443).then(function(certificate) {
    const date1 = new Date(certificate.valid_from);
    const date2 = new Date(certificate.valid_to);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // console.log(diffDays);
    return diffDays;
  });
}

exports.sslCertificateExpiration = (req, res) => {
  // console.log(req)
  const { url } = req.body;
  // exports.sslCertificateExpiration = (url, timeout, port, protocol) => {
  // console.log("llamando al certificado " + url);
  // VER URL : https://www.npmjs.com/package/get-ssl-certificate
  // sslCertificate.get('nodejs.org', 250, 443, 'https:')
  sslCertificate
    .get(url, 1000, 443)
    .then(function(certificate) {
      // console.log(certificate)
      // console.log(certificate.issuer)
      // console.log(certificate.valid_from);
      // console.log(certificate.valid_to);

      const date1 = new Date(certificate.valid_from);
      const date2 = new Date(certificate.valid_to);

      const diffTime = Math.abs(date2 - date1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // console.log(diffDays);

      res.json({
        success: true,
        message: "Información recuperada exitosamente.",
        data: {
          cer_days_exp: diffDays
        }
      });
    })
    .catch(err => {
      console.log(err);
      // responseData(req, res, data);
    });
};

exports.getJWToken = async (json, tokenType) => {
  const secretKey = process.env.JWT_PASS;
  const token = jwt.sign({...json, tokenType: tokenType}, secretKey, { algorithm: 'HS256'});
  return token;
};

exports.print = (print) => {
  if(process.env.DEBUG == 'true'){
      console.log(print)
  }
}

exports.generateHash = (param1, param2) => {
  const shaOBJ = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' })
  shaOBJ.update(param1)
  shaOBJ.update(param2)
  shaOBJ.update(HASH_KEY)
  const hash = shaOBJ.getHash('HEX')
  return hash
}
