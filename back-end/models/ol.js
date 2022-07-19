process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const cache = require('cocache')();
const requests = require('request');


const getToken = () => {
    return new Promise((resolve, reject) => {
        const getTokenTemp = () => makeRequestToken().then((data) => {
            cache.add({ id: 'token', datestart: Math.floor(Date.now() / 1000), ...data });
            resolve(data.access_token);
        }).catch((err) => reject(err))

        if (typeof(cache.get('token')) == 'undefined') {
            getTokenTemp()
        } else if ((Math.floor(Date.now() / 1000) - cache.get('token').datestart) > cache.get('token').expires_in) { //segundos de diferencia
            getTokenTemp()
        } else {
            resolve(cache.get('token').access_token)
        }
    });
}
const makeRequestToken = () => {
    return new Promise((resolve, reject) => {
        const ca = (process.env.APP_ENV == 'dev') ? null : fs.readFileSync(__dirname + '/cert/ol-' + process.env.APP_ENV + '.cer');
        try {
            requests.post({
                url: process.env.OL_URL + '/uaa/oauth/token',
                headers: {
                    'Authorization': process.env.OL_BASIC
                },
                formData: { grant_type: 'client_credentials' },
                ca
            }, (err, httpResponse, body) => {
                if(err) reject(err);  
                try{
                    body = JSON.parse(body);
                    if (typeof(body.access_token) == 'undefined') reject(err);                        
                        resolve(body);
                }catch(err){
                    reject(err);
                }
                    
            });
        } catch (err) {
            reject(err);
        }
    });
}

exports.makeRequest = data => {
    //console.log('====> data - body: ', data.body)
    return new Promise((resolve, reject) => {
        const ca = (process.env.APP_ENV == 'dev') ? null : fs.readFileSync(__dirname + '/cert/ol-' + process.env.APP_ENV + '.cer');
        getToken().then(token => {
            try {
                requests[data.method]({
                    url: process.env.OL_URL + data.resource,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    json: data.body,
                    ca
                }, (err, httpResponse, body) => {
                    if (err) reject(err);
                    if (body.error != null) reject(body);
                    resolve(body);
                });
            } catch (err) {
                reject(err);
            }
        }).catch(err => {
            reject(err);
        });
    });
}