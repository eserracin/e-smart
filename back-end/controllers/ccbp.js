const utility = require("../utility/utilities");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const fs = require("fs");
// const htmlDocx = require("html-docx-js");
const HtmlToDocx = require("html-to-docx");
const htmlXlsx = require("html2xlsx");
const Handlebars = require("handlebars");
const htmlPdf = require("html-pdf");
const CcbpServices = require("../services/ccbpServices");

exports.login = async (req, res) => {
  const ccbpSrv = new CcbpServices();
  const credentials = [];

  try {
    const result = await ccbpSrv.setClientAccount({
      ...req.body,
      type: "VC",
    });
    if (result.data.respuesta[0].success == "true") {
      const secretKey = process.env.JWT_PASS;
      const token = jwt.sign(
        { ...result.data.credenciales[0], roles: JSON.parse(result.data.credenciales[0].roles), tokenType: "VT" },
        secretKey,
        { algorithm: "HS256" }
      );
      credentials.push({
        token: token,
      });
      credentials.push({ questionID1: result.data.credenciales[0].questionId1 });
      credentials.push({ questionID2: result.data.credenciales[0].questionId2 });
      credentials.push({ questionID3: result.data.credenciales[0].questionId3 });
      utility.returnData(req, res, { credentials, ol_traceid: result.traceid });
    } else {
      // utility.returnError(req, res,"LOGIN-FAILED", {
      //     ol_traceid: result.traceid
      // },'Usuario o contraseña incorrecta.')
      utility.returnData(req, res, result.data.respuesta[0]);
    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.getReport = (req, res) => {
  const fileName = md5(Buffer.from(JSON.stringify(req.body))) + "." + req.params.format;
  const path = process.env.GLOBAL_DIR + "/public/tmp/reports/" + fileName;
  const url = process.env.URL_API + "/tmp/reports/" + fileName;
  const template = process.env.GLOBAL_DIR + "/resources/reports/templates/" + req.body.template + ".html";
  try {
    fs.access(path, fs.F_OK, (err) => {
      if (err) {
        //Generate new report
        try {
          fs.readFile(template, "utf-8", (err, source) => {
            utility.getError(req, res, err);
            var template = Handlebars.compile(source);
            template = template(req.body.data);

            switch (req.params.format) {
              // case 'pdf':
              //     htmlPdf.create(template).toFile(path, (err, res) => {
              //         if (err) return console.error(err);
              //     }
              //     break;
              case "docx":
                const fileBuffer = HtmlToDocx(template, null, {
                  orientation: "landscape",
                  margins: { top: 720,},
                });

                fs.writeFile(
                  path,
                  fileBuffer,
                  // htmlDocx.asBlob(template, {
                  //   orientation: "landscape",
                  //   margins: {
                  //     top: 720,
                  //   },
                  // }),
                  (err) => {
                    utility.getError(req, res, err, others);
                    utility.returnData(req, res, {
                      data: {
                        new: 0,
                        url,
                      },
                    });
                  }
                );
                break;
              case "xlsx":
                htmlXlsx(template, (err, file) => {
                  if (err) return console.error(err);
                  file
                    .saveAs()
                    .pipe(fs.createWriteStream(path))
                    .on("finish", () => {
                      utility.returnData(req, res, {
                        data: {
                          new: 0,
                          url,
                        },
                      });
                    });
                });
            }
          });
        } catch (err) {
          console.log(err);
          utility.returnError(req, res, err);
        }
        return;
      }

      //Using existing report
      utility.returnData(req, res, {
        data: {
          new: 1,
          url,
        },
      });
    });
  } catch (err) {
    console.log(err);
    utility.returnError(req, res, err);
  }
};

exports.sendEmail = async (req, res) => {
  let result = undefined;
  console.log("exports.sendEmail");
  try {
    result = await utility.sendEmail(
      req.id,
      req.body.toEmail,
      req.body.subject,
      req.body.templateName,
      req.body.paramsEmail,
      false
    );
  } catch (e) {
    result = e;
  }

  utility.returnData(
    req,
    res,
    {
      data: {
        result: result,
      },
    },
    false
  );
};

exports.setSecurityQuestions = async (req, res) => {
  const ccbpSrv = new CcbpServices();

  try {
    console.log(">>><<<<>> setSecurityQuestions => req.user: ", req.user);
    console.log(">>><<<<>> setSecurityQuestions => req.body: ", req.body);
    const result = await ccbpSrv.setClientAccount({
      ...req.body,
      ccbp_id: req.user.ccbpId,
      type: "UPI",
    });

    if (result.data.respuesta[0].success == "true") {
      utility.returnData(req, res, { ...result.data.respuesta[0], ol_traceid: result.traceid });
    } else {
      utility.returnError(req, res, result.data.respuesta[0], {
        ol_traceid: result.traceid,
      });
    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.validateQuestion = async (req, res) => {
  const ccbpSrv = new CcbpServices();

  let respuesta = {};

  try {
    const result = await ccbpSrv.setClientAccount({
      ...req.body,
      ccbp_id: req.user.ccbpId,
      username: req.user.email,
      type: "VR",
    });
    if (result.data.respuesta[0].success == "true") {
      await ccbpSrv.setClientAccount({
        ccbp_id: req.user.ccbpId,
        jwt_session: req.user.token,
        request_id: req.id,
        type: "UT",
      });

      respuesta["grupo"] = result.data.credenciales[0].roles;
      respuesta["success"] = result.data.respuesta[0].success;
      respuesta["message"] = result.data.respuesta[0].message;

      // utility.returnData(req, res,
      //     {...result.data.respuesta[0],ol_traceid: result.traceid})
      utility.returnData(req, res, { ...respuesta, ol_traceid: result.traceid });
    } else {
      utility.returnError(req, res, result.data.respuesta[0], {
        ol_traceid: result.traceid,
      });
    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.validateInvitationToken = async (req, res) => {
  const credentials = [];
  const ccbpSrv = new CcbpServices();

  utility
    .getJWToken(req.user, "VT")
    .then(async (tokenSesion) => {
      credentials.push({
        token: tokenSesion,
      });

      /**
       * ----------------------------------------
       * Actualizar token de sesion en la BD
       * ----------------------------------------
       */
      let result = await ccbpSrv.setClientAccount({
        ccbp_id: req.user.ccbpId,
        jwt_session: tokenSesion,
        type: "UT",
      });

      utility.returnData(req, res, { credentials, ol_traceid: result.traceid });
    })
    .catch((err) => {
      utility.returnError(req, res, err);
    });
};

exports.resendInvitation = async (req, res) => {
  const ccbpSrv = new CcbpServices();
  /**
   * ----------------------------------------
   * Obtener los datos del usuario
   * ----------------------------------------
   */
  try {
    let credenciales = await ccbpSrv.setClientAccount({
      username: req.body.email,
      type: "GU",
    });
    let element = {};

    element["ccbpId"] = credenciales.data.credenciales[0].ccbpId;
    element["email"] = credenciales.data.credenciales[0].email;

    utility.getJWToken(element, "VTI").then(async (tokenInvitation) => {
      /**
       * ----------------------------------------
       * Actualizar token de invitacion en la BD
       * ----------------------------------------
       */
      let result = await ccbpSrv.setClientAccount({
        ccbp_id: element.ccbpId,
        jwt_invitation: tokenInvitation,
        type: "UTI",
      });

      /**
       * ----------------------------------------
       * Envia el correo de Invitacion
       * ----------------------------------------
       */
      let params = {
        username: element.email,
        urlLoginToken: process.env.URL_APP + "/#/registro/" + tokenInvitation,
        urlLogin: process.env.URL_APP + "/#/registro",
      };

      utility
        .sendEmail(
          "1234",
          element.email,
          "Registro de Usuario - Portal Ecommerce",
          "ecommerce-send-invitation-mail",
          params,
          true
        )
        .then((result_email) => {
          console.log(`***DEBUG*** Email enviado correctamente`)
          utility.returnData(req, res, {
            data: "CORREO ENVIADO",
            ol_traceid: result.data.traceid,
          });
        })
        .catch((err) => {
          console.log(`***DEBUG*** Error con el utilitario ${err}`)
          utility.returnError(req, res, err, {
            ol_traceid: result.data.traceid,
          });
        });
    });
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.getNewMerchants = async (req, res) => {
  const ccbpSrv = new CcbpServices();
  ccbpSrv
    .getNewMerchants({})
    .then((data) =>
      utility.returnData(req, res, {
        data: data.data,
        ol_traceid: data.traceid,
      })
    )
    .catch((err) => utility.returnError(req, res, err));
};

exports.putClientsAccounts = async (req, res) => {
  const ccbpSrv = new CcbpServices();

  try {
    const result = await ccbpSrv.putClientsAccounts({
      ...req.body,
      company: 1,
      country: 1,
      requestId: "12345",
      source: "CUS-APPS_" + req.module,
    });


    if (result.data.resultSet1 == undefined) {

      if (req.body.type === "C" || req.body.type === "U") {
        let dataUser = {
          ccbpId: result.data.resultSet[0].ccbpId,
          email: req.body.email,
          externalAdm: req.body.externalAdm,
          parentId: req.body.parentId,
        };

        utility
          .getJWToken(dataUser, "VTI")
          .then(async (tokenInvitation) => {
            /**
             *
             * ----------------------------------------
             * Actualizar token de invitacion en la BD
             * ----------------------------------------
             */
            let result = await ccbpSrv.setClientAccount({
              ccbp_id: dataUser.ccbpId,
              jwt_invitation: tokenInvitation,
              type: "UTI",
            });

            /**
             * ----------------------------------------
             * Envia el correo de Invitacion
             * ----------------------------------------
             */
            //console.log(">>>>><<<<< getJWToken = tokenInvitation: ", tokenInvitation)

            let params = {
              username: dataUser.email,
              urlLoginToken: process.env.URL_APP + "/#/registro/" + tokenInvitation,
              urlLogin: process.env.URL_APP + "/#/registro",
            };

            if (!dataUser.externalAdm && dataUser.parentId === "0") {
              utility
                .sendEmail(
                  "1234",
                  dataUser.email,
                  "Registro de Usuario - Portal Ecommerce",
                  "ecommerce-send-invitation-user",
                  params,
                  true
                )
                .then((result) => {
                  console.log(result);
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }

      utility.returnData(req, res, {
        data: result.data,
        ol_traceid: result.traceid,
      });

    } else  {

      utility.returnData(req, res, {
        data: result.data,
        ol_traceid: result.data.traceid,
      });

    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.deleteClientAccount = async (req, res) => {
  const ccbpSrv = new CcbpServices();

  try {
    const resultGet = await ccbpSrv.putClientsAccounts({
      ...req.body,
      type: "R",
      company: 1,
      country: 1,
      requestId: "12345",
      source: "CUS-APPS_" + req.module,
    });

    let result = {};

    if ((resultGet.data.resultSet1[0].spSuccess = "true")) {
      resultGet.data.resultSet[0].email = Math.random().toString(36) + ".com-DISABLED";
      resultGet.data.resultSet[0].enabled = false;
      let today = new Date();

      const resultUpdate = await ccbpSrv.putClientsAccounts({
        ccbpId: req.body.ccbpId,
        type: "U",
        company: 1,
        country: 1,
        email: resultGet.data.resultSet[0].email,
        enabled: resultGet.data.resultSet[0].enabled,
        externalAdm: resultGet.data.resultSet[0].externalAdm,
        backOffice: resultGet.data.resultSet[0].backOffice,
        parentId: resultGet.data.resultSet[0].parentId,
        creationDate: resultGet.data.resultSet[0].creationDate,
        updateDate: today,
        requestId: "12345",
        source: "CUS-APPS_" + req.module,
      });

      if (resultUpdate.data.resultSet1[0].spSuccess) {
        result.success = resultUpdate.data.resultSet1[0].spSuccess;
        result.message = "User Deleted";
      } else {
        result.success = resultUpdate.data.resultSet1[0].spSuccess;
        result.message = resultUpdate.data.resultSet1[0].spErrorMessage;
      }

      utility.returnData(req, res, {
        data: result,
        ol_traceid: null,
      });
    } else {
      utility.returnError(req, res, result.data.resultSet1[0].spErrorMessage, {
        ol_traceid: result.traceid,
      });
    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.sendEmail = (req, res) => {
  utility
    .sendEmail(req, req.body.toEmail, req.body.subject, req.body.templateName, req.body.paramsEmail, false)
    .then((result) => {
      utility.returnData(req, res, {
        data: {
          result: result,
        },
      });
    })
    .catch((err) => {
      utility.returnError(req, res, err, null, "No se pudo enviar el correo.");
    });
};

exports.resendAccountInvitation = (req, res) => {
  let dataUser = {
    ccbpId: req.body.ccbpId,
    email: req.body.email,
  };

  utility
    .getJWToken(dataUser, "VTI")
    .then(async (tokenInvitation) => {
      /**
       * ----------------------------------------
       * Envia el correo de Invitacion
       * ----------------------------------------
       */

      let params = {
        username: dataUser.email,
        urlLoginToken: process.env.URL_APP + "/#/registro/" + tokenInvitation,
        urlLogin: process.env.URL_APP + "/#/registro",
      };

      utility
        .sendEmail(
          "1234",
          dataUser.email,
          "Registro de Usuario - Portal Ecommerce",
          "ecommerce-send-invitation-mail",
          params,
          true
        )
        .then((result) => {
          console.log(result);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });

  utility.returnData(req, res, {
    data: { success: true },
    ol_traceid: null,
  });
};


// Esta es la parte nueva del E-Smart
exports.loginV2 = async (req, res) => {
  const ccbpSrv = new CcbpServices();
  const credentials = {};

  try {
    const result = await ccbpSrv.setClientAccount({
      ...req.body,
      type: "VC",
    });

    if (result.data.respuesta[0].success == "true") {
      const secretKey = process.env.JWT_PASS;
      const token = jwt.sign(
        { ...result.data.credenciales[0], roles: JSON.parse(result.data.credenciales[0].roles), tokenType: "VT" },
        secretKey,
        { algorithm: "HS256" }
      );

      credentials: {
        api_token: token
      }

      utility.returnData(req, res, { api_token: token, ol_traceid: result.traceid });
    } else {
      utility.returnData(req, res, result.data.respuesta[0]);
    }
  } catch (err) {
    utility.returnError(req, res, err);
  }
};

exports.getUserByToken = async (req, res) =>{
  const ccbpSrv = new CcbpServices();

  const token = req.body.jwt_session

  req.user = jwt.verify(token, process.env.JWT_PASS, {
    algorithms: ["HS256"],
    ignoreExpiration: true
  });

  // console.log("***DEBUG => getUserByToken => req.user", req.user)

  const result = await ccbpSrv.setClientAccount({
    ccbp_id: req.user.ccbpId,
    request_id: "12345",
    source: "CUS-APPS_" + req.module,
    type: "JWT",
  });

  console.log("***DEBUG => getUserByToken => result", result.data)

  if(result.data.credenciales[0] !== null){
    utility.returnData(req, res, { ...result.data.credenciales[0] });
  }else{
    utility.returnData(req, res, { success: false, message: "TOKEN-INVALIDO" });
  }
}
