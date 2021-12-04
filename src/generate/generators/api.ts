import { writeFileSync } from 'fs'
import { join } from 'path'
import { upperFirst, toCamelCase } from '../../utils'

export class Api {
    private _fileName: string
    private _absolutePath: string

    constructor(fileName: string, absolutePath: string) {
        this._fileName = fileName
        this._absolutePath = absolutePath
    }

    private get _templete() {
        return `import { AxiosInstance } from 'axios'
import { AppStore } from '${this._absolutePath}stores/index'

export class ${upperFirst(toCamelCase(this._fileName))}Api {
    constructor(
        private httpClient: AxiosInstance,
        private store: AppStore
    ) {}
}

`
    }

    public generate() {
        writeFileSync(
            join(process.cwd(), `src/apis/${this._fileName}.ts`),
            this._templete
        )
    
        console.info(`api ${this._fileName} is already generated!`)
    }
}
