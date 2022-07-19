const Ol = require("../models/ol");

class ecommerceServices {
    constructor(){
    }

    getPerfil(...data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ecommerce-api/api/v1/portal/get-perfil"
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

    paymentOrder(...data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ecommerce-api/api/v1/portal/payment-order"
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

    ecommerceCrud(...data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ecommerce-api/api/v1/core/ecommerce-crud"
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

    getMerchantName(...data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ecommerce-api/api/v1/portal/get-merchant"
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

    apiKey(...data) {
        return new Promise((resolve, reject) => {
            try {
                Ol.makeRequest({
                        body: data[0],
                        method: "post",
                        resource: "/ecommerce-api/api/v1/portal/api-key"
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

module.exports = ecommerceServices