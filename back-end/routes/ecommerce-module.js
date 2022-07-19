const ecommerceController = require("../controllers/ecommerceController");
const router = require("express").Router();
const sslExpiration = require("../utility/utilities");


//busqueda de perfiles
router.post("/v1/get-perfil", ecommerceController.getPerfil);

//busqueda de perfiles
router.post("/v1/get-merchant", ecommerceController.getMerchantName);

//busqueda de transacciones consolidados
router.post("/v1/transaction-resume", ecommerceController.getTransactionResume);

//busqueda de contracargos detalle
router.post("/v1/chargeback-detail", ecommerceController.getChargebackDetail);

//busqueda de transacciones detalle
router.post("/v1/transaction-detail-search",ecommerceController.getTransactionDetailSearch);

// //busqueda de Ranking por pais
// router.post("/v1/rank-by-country", ecommerceController.getRankByCountry);

// Obtiene el numero de dias que restan para que se venza el certificado SSL
router.post("/v1/Allsslexpiration", sslExpiration.sslAllCertificateExpiration);

// Crear Orden de pago
router.post("/v1/payment-order-create", ecommerceController.createPaymentOrder);

// Pagar Orden de pago
router.post("/v1/payment-order", ecommerceController.putPaymentOrder);

// Validar Orden de pago
router.post("/v1/validate-order", ecommerceController.validateOrder);

// Crud Api Key
router.post("/v1/api-key", ecommerceController.putApiKey);

// Crud Ecommerce
router.post("/v1/ecommerce", ecommerceController.putEcommerce);

// Crud Clients Accounts x Ecommerce
router.post("/v1/clients-accounts-x-ecommerce", ecommerceController.putClientsAccountsEcommerce);

// Get Apy Keys By Merchant
router.post("/v1/get-api-keys", ecommerceController.getApiKeys);

module.exports = router;
