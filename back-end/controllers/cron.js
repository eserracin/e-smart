const cron = require("node-cron");
const CcbpServices = require('../services/ccbpServices') 
const utility = require('../utility/utilities')


// sending emails at periodic intervals
exports.startCronJob = async () =>{

    cron.schedule("*/2 * * * *", async () => {
        console.log("---------------------");
        console.log("Running Cron Job");


        const ccbpSrv = new CcbpServices();
        try {
            let result = await ccbpSrv.getNewMerchants({})
            console.log('New Merchants: ',result.data.resultSet)

            if(result.data.resultSet){
                for(let element of result.data.resultSet){
                    utility.getJWToken(element, 'VTI').then( async tokenInvitation => {

                        /**
                         * 
                         * ----------------------------------------
                         * Actualizar token de invitacion en la BD
                         * ----------------------------------------
                         */
                        let result = await ccbpSrv.setClientAccount({  
                            ccbp_id: element.ccbpId,
                            jwt_invitation: tokenInvitation,
                            type: 'UTI'
                        })
                        
                        /**
                         * ----------------------------------------
                         * Envia el correo de Invitacion
                         * ----------------------------------------
                         */
                        let params = {
                            'username': element.email,
                            'urlLoginToken': process.env.URL_APP + '/#/registro/' + tokenInvitation,
                            'urlLogin': process.env.URL_APP + '/#/registro'
                        }
                        if(element.parentId == null && !element.externalAdm){
                            utility.sendEmail(
                                '1234',
                                element.email,
                                'Registro de Usuario - Portal Ecommerce',
                                'ecommerce-send-invitation-user',
                                params,
                                true
                            ).then( result => {
                                console.log(result)
                            }).catch(err => {
                                console.log(err)
                            })
                        }else{
                            utility.sendEmail(
                                '1234', 
                                element.email, 
                                'Registro de Usuario - Portal Ecommerce', 
                                'ecommerce-send-invitation-mail',
                                params,
                                true
                            ).then( result => {
                                console.log(result)
                            }).catch(err => {
                                console.log(err)
                            })
                        }
                    }).catch(
                        err => { console.log(err)}
                    );
                }
            }
        }catch(err) {
            console.log(err)
        }
    });
}