const ccbPController = require("../controllers/ccbp");
const router = require("express").Router();

router.post("/v1/report/:format", ccbPController.getReport);

//Actualización Password y Preguntas y Respuestas de seguridad
router.post("/v1/security/security-questions",ccbPController.setSecurityQuestions);

//Validar preguntas de seguridad
router.post("/v1/security/validate-question", ccbPController.validateQuestion);

//Verificar Token Invitación
router.post("/v1/security/validate-invitation-token",ccbPController.validateInvitationToken);

//New Merchants
router.post("/v1/security/get-new-merchants",ccbPController.getNewMerchants);

// Crud Clients Accounts
router.post("/v1/security/clients-accounts", ccbPController.putClientsAccounts);

// Delete Clients Accounts
router.post("/v1/security/clients-accounts-delete", ccbPController.deleteClientAccount);

// send Custom Emails
router.post('/v1/email/send', ccbPController.sendEmail);

// send invitation Account Emails
router.post('/v1/security/email/invitation', ccbPController.resendAccountInvitation);



router.post('/v1/security/get-user-by-token', ccbPController.getUserByToken);

module.exports = router;
