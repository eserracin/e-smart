export interface AuthModel {
  api_token: string
  refreshToken?: string
}


// export interface AuthModel {
//   data: {
//       credentials: {
//         [index: number]: {
//           email: string;
//           lastName: string;
//           name: string;
//           grupos: string;
//           ccbpId: string;
//           token: string;
//           questionID1: string;
//           questionID2: string;
//           questionID3: string;
//           message: string;
//         }
//       }
//   }
// }

export interface UserAddressModel {
  addressLine: string
  city: string
  state: string
  postCode: string
}

export interface UserCommunicationModel {
  email: boolean
  sms: boolean
  phone: boolean
}

export interface UserEmailSettingsModel {
  emailNotification?: boolean
  sendCopyToPersonalEmail?: boolean
  activityRelatesEmail?: {
    youHaveNewNotifications?: boolean
    youAreSentADirectMessage?: boolean
    someoneAddsYouAsAsAConnection?: boolean
    uponNewOrder?: boolean
    newMembershipApproval?: boolean
    memberRegistration?: boolean
  }
  updatesFromKeenthemes?: {
    newsAboutKeenthemesProductsAndFeatureUpdates?: boolean
    tipsOnGettingMoreOutOfKeen?: boolean
    thingsYouMissedSindeYouLastLoggedIntoKeen?: boolean
    newsAboutStartOnPartnerProductsAndOtherServices?: boolean
    tipsOnStartBusinessProducts?: boolean
  }
}

export interface UserSocialNetworksModel {
  linkedIn: string
  facebook: string
  twitter: string
  instagram: string
}

export interface UserModel {
  id: number
  username: string
  password: string | undefined
  email: string
  first_name: string
  last_name: string
  fullname?: string
  occupation?: string
  companyName?: string
  phone?: string
  roles?: Array<number>
  pic?: string
  language?: 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'ru'
  timeZone?: string
  website?: 'https://keenthemes.com'
  emailSettings?: UserEmailSettingsModel
  auth?: AuthModel
  communication?: UserCommunicationModel
  address?: UserAddressModel
  socialNetworks?: UserSocialNetworksModel
}

export interface UserModelESmart {
  ccbpId: number
  email: string
  username: string
  first_name: string
  last_name: string
  roles: Array<string>
  questionId1: string
  questionId2: string
  questionId3: string
  password?: string | undefined
  enabled?: number
  creation_date?: Date
  update_date?: Date
  blocked?: number
  deleted?: number
  invited?: number
  registered?: number
  selected?: number
  auth?: AuthModel
}
