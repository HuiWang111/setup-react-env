import { AppStore } from '@/stores/index'
import { AuthApi } from './auth'
import { UserApi } from './user'
import { Http } from '@/utils/index'
import { AxiosInstance } from 'axios'

export class AppApi {
    auth: AuthApi
    user: UserApi

    constructor(private store: AppStore) {
        const httpClient: AxiosInstance | undefined = new Http().client

        this.auth = new AuthApi(httpClient, store)
        this.user = new UserApi(httpClient, store)
    }
}