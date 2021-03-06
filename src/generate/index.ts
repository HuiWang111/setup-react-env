import {
    Api,
    Model,
    Store,
    Style,
    DOMView,
    NativeView
} from './generators'
import { getProjectType } from './utils'
import { isCamelCase } from '../utils'

export async function generate(commands: string[]) {
    const [type, fileName] = commands

    if (isCamelCase(fileName)) {
        console.error('do not use camelCase, please use snake_case or kebab-case')
        return
    }
    
    const projectType = getProjectType()
    const absolutePath = projectType === 'native' ? '@/' : ''
    
    switch (type) {
        case 'api': {
            (new Api(fileName, absolutePath)).generate()
            break
        }
        case 'model': {
            (new Model(fileName, absolutePath)).generate()
            break
        }
        case 'store': {
            (new Store(fileName)).generate()
            break
        }
        case 'style': {
            if (projectType !== 'native') {
                console.error('your projectType should be `native`')
            } else {
                (new Style(fileName)).generate()
            }
            break
        }
        case 'view': {
            if (!projectType) {
                console.error('package.json not include field `projectType`!')
            } else if (projectType === 'native') {
                (new NativeView(fileName)).generate()
            } else {
                (new DOMView(fileName)).generate()
            }
            break
        }
        // 创建区块，执行以上所有 type
        case 'block': {
            await (new Api(fileName, absolutePath)).generate()
            await (new Model(fileName, absolutePath)).generate()
            await (new Store(fileName)).generate()

            if (projectType === 'native') {
                console.info('')
                console.info('please select style file directory')
                await (new Style(fileName)).generate()
            }

            console.info('')
            console.info('please select view file directory')
            if (projectType === 'native') {
                await (new NativeView(fileName)).generate()
            } else {
                await (new DOMView(fileName)).generate()
            }
            break
        }
        default:
            console.error('type is not correct!!!')
    }
}
