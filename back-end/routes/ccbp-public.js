const ccbPController = require('../controllers/ccbp');
const router = require('express').Router();

//Ingreso a la aplicación
router.post('/v1/login', ccbPController.login);

router.post('/v2/login', ccbPController.loginV2);

//Reenviar Invitación
router.post("/v1/security/resend-invitation",ccbPController.resendInvitation);


module.exports = router;