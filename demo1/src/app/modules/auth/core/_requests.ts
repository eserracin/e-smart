import axios, { AxiosResponse } from 'axios'
import {AuthModel, UserModel} from './_models'
import {ResponseESmart} from '_metronic/helpers'
import jwt from 'jsonwebtoken'

// const API_URL = process.env.REACT_APP_API_URL
const API_URL = 'https://localhost:7000'

//export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verify_token`
// export const LOGIN_URL = `${API_URL}/login`7
export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/api/v1/security/get-user-by-token`
export const LOGIN_URL = `${API_URL}/v2/login`

export const REGISTER_URL = `${API_URL}/register`
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`

// Server should return AuthModel
export function login(email: string, password: string) {
  return axios.post<ResponseESmart<AuthModel>>(LOGIN_URL, {
    username: email,  
    password,
  })
}

// export function login(email: string, password: string) {
//   return axios.post('https://localhost:7000/v1/login', {
//     username: email,  
//     password
//   })
//   .then((response:  AxiosResponse<AuthModel>) => response.data)
// }

// Server should return AuthModel
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  return axios.post(REGISTER_URL, {
    email,
    first_name: firstname,
    last_name: lastname,
    password,
    password_confirmation,
  })
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return axios.post<{result: boolean}>(REQUEST_PASSWORD_URL, {
    email,
  })
}

// export function getUserByToken(token: string) {
//   return axios.post<UserModel>(GET_USER_BY_ACCESSTOKEN_URL, {
//     api_token: token,
//   })
// }

export function getUserByToken(token: string) {
  return axios.post<ResponseESmart<UserModel>>(GET_USER_BY_ACCESSTOKEN_URL, {
    jwt_session: token,
  })
}
