const utility = require("../utility/utilities");
const Ol = require("../models/ol");
const sslCertificate = require("get-ssl-certificate");
const EcommerceServices = require('../services/ecommerceServices') 
const sslChecker = require("ssl-checker")


const ecommerceSrv = new EcommerceServices();

exports.getPerfil = async(req, res) => {
    try {
        const result = await ecommerceSrv.getPerfil({
          ...req.body,
          clientId: 0,
          company: 1,
          country: 1,
          emailAddress: req.user.email,
          financialInstitution: "string",
          format: "json",
          ipWebservice:
            req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          source: "CUS-APPS_" + req.module
        })

        const urls = await findCerticates(result.data.merchantProvider);
        const ranking = await findRanking(req, urls);
        
        utility.returnData(
          req,
          res,
          {
            data: result.data,
            result: ranking,
            ranking: ranking,
            ol_traceid: result.traceid
          }
        );

    } catch(err) {
        utility.returnError(req, res,err)
    }
};


const findRanking = async (req, urls) => {
  let aux = 1;
  let listData = [];
  let result = "sin dato";
  let final = "sin dato";

  for (obj of urls) {
    try {
      const data = {
        company: 1,
        country: 1,
        jsonData: null,
        requestId: aux,
        source: "json",
        url: obj.newurl
      };

      result = await testCountry(data, req);
      final = await handleAlexaResponde(result);
      aux = aux + 1;
    } catch (error) {}
    const newdata = {
      ...obj,
      ranking: final
    };
    listData.push(newdata);
  }

  return listData;
};

const handleAlexaResponde = result => {
  let rank = "sin dato";

  if (result.success) {
    const countrys =
      result.data.responseResults.responseResult.responseAlexa
        .responseTrafficData.responseRankByCountry.responseCountry;
    countrys.forEach(e => {
      if (e.code === "PA") {
        rank = e.rank;
      }
    });
  } else {
    return "sin dato";
  }
  return rank;
};

const findCerticates = async merchantProviders => {
  const urls = [];

  for (e of merchantProviders) {
    if (e.webSiteUrl !== "") {
      const resultado = urls.find(u => u.webSiteUrl === e.webSiteUrl);
      if (resultado === undefined) {
        let word = e.webSiteUrl.replace("https://", "");

        word = word.replace("/", "");
        const urlnowww = word.replace("www.", "");
        const newData = {
          ...e,
          newurl: word,
          urlnowww: urlnowww
        };
        urls.push(newData);
      }
    }
  }
  try {
    const response = await callCerticates(urls);

    return response;
  } catch (error) {
    console.log("error", error);
    return [];
  }
};

const callCerticates = async rows => {
  let listData = [];
  let result = "";
  for (obj of rows) {
    result = "Error SSL";
    try {
      result = await GetCerticate(obj.newurl);
    } catch (error) {
      console.log("Error calculando SSL");
      console.log(error);
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
  // return sslCertificate.get(url, 5000, 443).then(function(certificate) {
  //   const date1 = new Date();
  //   const date2 = new Date(certificate.valid_to);
  //   const diffTime = Math.abs(date2 - date1);
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   console.log("*** DEBUG: GetSSLExpirationDays: ", diffDays)
  //   return diffDays;
  // });
  return sslChecker(url, { method: "GET", port: 443, rejectUnauthorized: false}).then(result => {
    const date1 = new Date();
    const date2 = new Date(result.validTo);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log("*** DEBUG: GetSSLExpirationDays: ", diffDays)
    return diffDays;
  });
}

exports.getTransactionDetail = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
      body: {
        ...req.body,
        emailAddress: req.user.email,
        format: "json",
        ipWebservice:
          req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        source: "CUS-APPS_" + req.module
      },
      method: "post",
      resource: "/ecommerce-api/api/v1/portal/transaction-detail"
    }
  )
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};

exports.getMerchantName = async(req, res) => {

  let defaultRequestValues = {
    company: 1,
    country: 1,
    requestId: "123456",
    source: "CUS-APPS_" + req.module
  };

  try{

    const responseMerchant = await ecommerceSrv.getMerchantName({
      clientId: req.body.clientId,
      ...defaultRequestValues
    })

    console.log(`***DEBUG*** responseMerchant: ${JSON.stringify(responseMerchant)}`)

    if(responseMerchant.data.resultSet !== null){
      const clientId = responseMerchant.data.resultSet[0].clientId
      const merchantName = responseMerchant.data.resultSet[0].merchantName

      const clientHash = utility.generateHash(clientId, merchantName)

      const responseEcommerceCrud = await ecommerceSrv.ecommerceCrud({
        clientId: clientHash,
        type: 'R',
        ...defaultRequestValues
      })

      if(responseEcommerceCrud.data.resultSet !== null)
      {
        utility.returnData(
          req,
          res,
          {
            message: "El comercio ya esta registrado",
            ol_traceid: responseEcommerceCrud.data.ol_traceid
          }
        )   
      }else{
          utility.returnData(
            req,
            res,
            {
              ...responseMerchant.data.resultSet[0],
              ol_traceid: responseMerchant.data.ol_traceid
            }
          ) 
      }

    }else if(responseMerchant.data.resultSet1 !== null){
      utility.returnData(
          req,
          res,
          {
            data: responseMerchant.data.resultSet1[0],
            ol_traceid: responseMerchant.data.ol_traceid
          }
        ) 
    }else{
        utility.returnData(
          req,
          res,
          {
            message: "Comercio no encontrado",
            ol_traceid: responseMerchant.data.ol_traceid
          }
        )
    }


  } catch(err){
    utility.returnError(req, res, err)
  }
};

exports.getTransactionDetailSearch = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
    body: {
      ...req.body,
      company: 1,
      country: 1,
      format: "json",
      ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: "CUS-APPS_" + req.module
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/portal/transaction-detail-search"
  })
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};

exports.getChargebackDetail = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
    body: {
      ...req.body,
      company: 1,
      country: 1,
      format: "json",
      ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: "CUS-APPS_" + req.module
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/portal/chargeback-detail"
  })
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};

exports.getTransactionResume = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
    body: {
      ...req.body,
      emailAddress: req.user.email,
      format: "json",
      ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: "CUS-APPS_" + req.module
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/portal/transaction-resume"
  })
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};

const testCountry = async (data, req) => {
  const result = await Ol.makeRequest({
    body: {
      ...data,
      format: "json",
      emailAddress: req.user.email,
      ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: MODULE_NAME
    },
    method: "post",
    resource: "/ecommerce-api/api/rankbycountryall"
  }).then(data => data);
  return result;
};

// exports.getRankByCountry = (req, res) => {
//   Ol.makeRequest({
//     body: {
//       ...req.body,
//       format: "json",
//       emailAddress: req.user.email,
//       ipWebservice:
//         req.headers["x-forwarded-for"] || req.connection.remoteAddress,
//       source: "CUS-APPS_" + req.module
//     },
//     method: "post",
//     resource: "/ecommerce-api/api/rankbycountryall"
//   })
//     .then(data =>
//       utility.returnData(
//         req,
//         res,
//         {
//           data: data.data,
//           ol_traceid: data.traceid
//         }
//       )
//     )
//     .catch(err => utility.returnError(req, res, err));
// };

exports.putApiKey = async (req, res) => {

  let apiKeyValid = true;

  if (req.body.type === 'C') {
    let apiKey = req.body.apiKey;

    try {
      // emulate dummy transaction
      let resultNmi = await Ol.makeRequest({
        body: {
          type: 'sale',
          ccnumber: '4111111111111111',
          ccexp: '10/25',
          ccv: '999',
          amount: '0.00',
          security_key: apiKey
        },
        method: "post",
        resource: "/ecommerce-api/api/v1/ecommerce/nmi-transaction"
      });
      console.log("<<>>><< DEBUG => putApiKey => resultNmi: ", resultNmi)
    } catch (e) {
      console.log(e.error.detail);
      if(e.error.detail !==null){
        if (!e.error.detail.toString().includes('Invalid amount')) {
          apiKeyValid = false;
        }
      }
    }
  }

  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  if (apiKeyValid) {
    Ol.makeRequest({
      body: {
        ...req.body,
        company: 1,
        country: 1,
        format: "json",
        ipWebservice:
            req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        source: "CUS-APPS_" + req.module
      },
      method: "post",
      resource: "/ecommerce-api/api/v1/portal/api-key"
    })
        .then(data =>
            utility.returnData(
                req,
                res,
                {
                  data: data.data,
                  ol_traceid: data.traceid
                }
            )
        )
        .catch(err => utility.returnError(req, res, err));
  } else {
    utility.returnData(
        req,
        res,
        {
          error: "Api Key Invalido para el registro",
          ol_traceid: null
        }
    )
  }
};

exports.getApiKeys = async (req, res) => {

  let merchants = req.body;
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  const forLoop = async _ => {
    for (let index = 0; index < merchants.length; index++) {
      let apiKeys = await Ol.makeRequest({
        body: {
          type: 'G',
          merchantNumber: 0,
          number: null,
          clientId: merchants[index].clientId,
          company: 1,
          country: 1,
          format: "json",
          ipWebservice:
              req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          source: "CUS-APPS_" + req.module
        },
        method: "post",
        resource: "/ecommerce-api/api/v1/portal/api-key"
      });
      console.log("***DEBUG*** => apiKeys: ", apiKeys)

      merchants[index].apiKeys = apiKeys.data.resultSet;
    }
  };


  try {
    await forLoop();

    utility.returnData(
        req,
        res,
        merchants
    )
  } catch (e) {
    utility.returnError(req, res, e)
  }

};

exports.putEcommerce = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  console.log('>>>>DEBUG: reg.body', req.body)
  Ol.makeRequest({
    body: {
      ...req.body,
      company: 1,
      country: 1,
      requestId: '12345',
      source: "CUS-APPS_" + req.module
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/core/ecommerce-crud"
  })
    .then(data => {
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      ),
      console.log('>>>>DEBUG: data', data.data)
    })
    .catch(err => utility.returnError(req, res, err));
};

exports.putClientsAccountsEcommerce = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
    body: {
      ...req.body,
      company: 1,
      country: 1,
      source: "CUS-APPS_" + req.module
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/core/accounts-x-ecommerce-crud"
  })
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};


exports.createPaymentOrder = async (req, res) => {

  //TODO: usar email para envio de correo
  let email = req.body.clientEmail;

  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  Ol.makeRequest({
    body: {
      ...req.body,
      type: 'C',
      accountId: 0,
      company: 1,
      country: 1,
      format: "json",
      ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: "CUS-APPS_" + req.module,
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/portal/payment-order"
  })
    .then(data => {
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      );
    })
    .catch(err =>
        utility.returnError(req, res, err)
    );
};


exports.putPaymentOrder = async (req, res) => {

  let defaultRequestValues = {
    company: 1,
    country: 1,
    format: "json",
    ipWebservice:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    source: "CUS-APPS_" + req.module
  };
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv
  try{

    const responseApiKey = await ecommerceSrv.apiKey({
      type: 'G',
      merchantNumber: 0,
      number: req.body.apikeyNumber == 0 ? null :  req.body.apikeyNumber,
      clientId: req.body.apikeyHash,
      ...defaultRequestValues
    })

    console.log("***DEBUG1 => responseApiKey: ", responseApiKey.data)

    // obtenemos el api key
    let securityKey;
    let ecommerceEmail;
    let ecommerceName;

    if(responseApiKey.data.resultSet1[0].spSuccess){
      securityKey = responseApiKey.data.resultSet[0].apiKey;

      // ubicamos el correo del comercio
      let clientId = responseApiKey.data.resultSet[0].clientId;

/*      const responseEcommerceCrud = await ecommerceSrv.ecommerceCrud({
        type: 'R',
        clientId: clientId,
        ...defaultRequestValues
      })*/

      const responseEcommerceCrud = await ecommerceSrv.ecommerceCrud({
        type: 'R',
        clientId: req.body.apikeyHash,
        requestId: '123456',
        ...defaultRequestValues
      })
  
      if(responseEcommerceCrud.data.resultSet1[0].spSuccess){
        ecommerceEmail = responseEcommerceCrud.data.resultSet[0].email;
        ecommerceName = responseEcommerceCrud.data.resultSet[0].name;
      }
    }

    const responsePayOrder = await ecommerceSrv.paymentOrder({
      ...req.body,
      securityKey: securityKey,
      // accountId: 0,
      enabled: false,
      // responseCode: 0,
      type: 'U',
      ...defaultRequestValues
    })
    
    let responseData = responsePayOrder.data[0];
    responseData.ecommerceEmail = ecommerceEmail;
    responseData.ecommerceName = ecommerceName;
    if (responseData.responseDetails === 'Success') {
      try {
        await sendEmail(responseData);
      } catch (e) {
        console.log(e);
      }
    }

    utility.returnData(
      req,
      res,
      {
        data: responsePayOrder.data,
        ol_traceid: responsePayOrder.traceid
      }
    )

  }catch(err){
    utility.returnError(req, res, err)
  }

};

const sendEmail = (element) => {
  console.log("======> element", element)

    let params = {
        'clientName': element.clientName,
        'merchantName': element.ecommerceName,
        'orderDescription': element.orderDescription,
        'amount': element.amount
        }

      utility.sendEmail(
          element.orderId,
          element.clientEmail,
          'Confirmación de pago - Portal Ecommerce',
          'ecommerce-confirmation-pay-mail',
          params,
          false
      ).then( result => {
        console.log(result)
      }).catch(err => {
        console.log(err)
      })

      utility.sendEmail(
          element.orderId,
          element.ecommerceEmail,
          'Confirmación de pago - Portal Ecommerce',
          'ecommerce-from-user-confirmation-pay-mail',
          params,
          false
      ).then( result => {
        console.log(result)
      }).catch(err => {
        console.log(err)
      })
}

exports.validateOrder = (req, res) => {
  // FIXME: cambiar al formato de llamar ol objeto ecommerceSrv                 
  Ol.makeRequest({
    body: {
      ...req.body,
      accountId: 0,
      company: 1,
      country: 1,
      format: "json",
      ipWebservice:           
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      source: "CUS-APPS_" + req.module,
      type: "V"
    },
    method: "post",
    resource: "/ecommerce-api/api/v1/portal/payment-order"
  })
    .then(data =>
      utility.returnData(
        req,
        res,
        {
          data: data.data,
          ol_traceid: data.traceid
        }
      )
    )
    .catch(err => utility.returnError(req, res, err));
};

