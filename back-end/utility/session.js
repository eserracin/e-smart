const CcbpServices = require("../services/ccbpServices");
const utility = require("./utilities");
const jwt = require("jsonwebtoken");
const APP_NAME = 'CCB-CUS'
const toEncrypt = ['password', 'response_1', 'response_2', 'response_3']

exports.validation = async (req, res, next) => {
  console.log("***DEBUG: req.originalUrl", req.originalUrl)
  console.log("***DEBUG: req.baseUrl", req.baseUrl)
  console.log("***DEBUG: req.path", req.path)
  req.module = req.originalUrl.match(/\w+\-module/g)
  req.module = (req.module)?req.module[0].replace('-module','').toUpperCase():APP_NAME
  toEncrypt.map(item => {
    if(req.body[item])
      req.body[item] = utility.encrypt(req.body[item])
  })
  if(req.module == APP_NAME && req.originalUrl.search("/api/") == -1) {
    req.user = { ccbpId: "public"}
    next()
  } else if(req.originalUrl.search("/validate-order") != -1) {
    req.user = { ccbpId: "ecommerce"}
    next();
  // } else if(req.originalUrl.search("/payment-order") != -1) {
  //   req.user = { ccbpId: "ecommerce"}
  //   next();
  } else if(req.path === "/v1/payment-order") {
    req.user = { ccbpId: "ecommerce"}
    next();
  } else if(req.path === "/v1/security/get-user-by-token") {
    req.user = { ccbpId: "ecommerce"}
    next();
  }else {
    try {
      const token = req.headers.authorization.replace("Bearer ", "");
      req.user = jwt.verify(token, process.env.JWT_PASS, {
        algorithms: ["HS256"],
        ignoreExpiration: true
      });
      req.user.token = token;
      if(req.originalUrl.search("/security/validate-question") != -1) {
        next();
      }else{
        const ccbpSrv = new CcbpServices();
        let result;
        
        result = await ccbpSrv.setClientAccount({
          ccbp_id: req.user.ccbpId,
          jwt_session: token,
          jwt_invitation: token,
          request_id: req.id,
          type: req.user.tokenType
        });
        if (result.data.respuesta[0].success == "true") {
          next(); //TODO: procesar permisos basado en el usuario y los request que tiene permitido hacer.
        } else {
          utility.returnError(req, res, "TOKEN-INVALID", {
            ol_traceid: result.data.ol_traceid
          });
        }
      }
    } catch (err) {
      utility.print(err)
      req.user = (req.user)?req.user:{ ccbpId: "noUser"}
      utility.returnError(
        req,
        res,
        "TOKEN-INVALID-FAILED",null,
        "Hubo un problema con la validación del token de la petición."
      );
    }
  }
};
