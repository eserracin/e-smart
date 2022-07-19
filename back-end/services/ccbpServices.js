const Ol = require("../models/ol");

class CcbpServices {

    constructor(){
    }

    setClientAccount(data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                    body: {
                        company:  1,
                        source:  'CCB-CUS',
                        country: 1,
                        requestId: data.request_id,
                        ccbpId: data.ccbp_id,
                        email: data.username,
                        password: data.password,
                        questionId1: data.question_id_1,
                        response1: data.response_1,
                        questionId2: data.question_id_2,
                        response2: data.response_2,
                        questionId3: data.question_id_3,
                        response3: data.response_3,
                        appLoad: data.app_load,
                        jwtSession: data.jwt_session,
                        jwtInvitation: data.jwt_invitation,
                        type: data.type
                    },
                    method: "put",
                    resource: "/ccb-portal-api/api/v1/set-client-account/"
                }).then(result => {
                    resolve(result)
                }).catch(err => {
                    reject(err)
                })
            } catch (e) {
                console.log(e)
                reject(err)
            }
        })
    } 

    getNewMerchants(data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                    body: {
                    },
                    method: "post",
                    resource: "/ccb-portal-api/api/v1/new-merchants"
                }).then(result => {
                    resolve(result)
                }).catch(err => {
                    reject(err)
                })
            } catch (e) {
                console.log(e)
                reject(err)
            }
        })
    } 

    putClientsAccounts(...data) {
        
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ccb-portal-api/api/v1/core/clients-accounts-crud"
                }).then(result => {
                    resolve(result)
                }).catch(err => {
                    reject(err)
                })
            } catch (e) {
                console.log(e)
                reject(err)
            }
        })
    };
}

module.exports = CcbpServices