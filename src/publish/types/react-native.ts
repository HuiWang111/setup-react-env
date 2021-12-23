import { PublishConfig, PublishMode, InternalPublishConfig } from '../interface'
import {
    isCodeUpToDate,
    getCurrentBranch,
    writeBuildGradleFileByEnv,
    getYMD,
    writeVersion,
    writeEnv,
    writeAppName,
    buildApk,
    copyApp,
    openApkDir,
    cleanCodeChange,
    codePush as runCodePush
} from '../utils'
import inquirer from 'inquirer'

export function mergeConfig({
    shouldCleanCodeChange = true,
    mode = 'test',
    shouldRewriteApplicationId = false,
    applicationId = '',
    generateVersion = false,
    versionFilePath = 'src/config',
    extname = 'ts',
    generateEnv = false,
    envFilePath = 'src/config',
    generateAppName = false,
    codePush = false,
    open = false,
    shouldCopyApp = false,
    onComplete
}: PublishConfig = {
    shouldCleanCodeChange: true,
    mode: 'test',
    shouldRewriteApplicationId: false,
    applicationId: '',
    generateVersion: false,
    versionFilePath: 'src/config',
    extname: 'ts',
    generateEnv: false,
    envFilePath: 'src/config',
    generateAppName: false,
    codePush: false,
    open: false,
    shouldCopyApp: false
}, message = ''): InternalPublishConfig {
    return {
        /**
         * 打包完成后是否执行 git checkout . 清空代码的改动
         * 由于打包过程中可能会有写入文件的操作造成代码的改动，而这些打包完成之后无需保留，此时可以设置该项为true
         */
        shouldCleanCodeChange,
        /**
         * 'test' | 'production'
         * 打正式包还是打测试包
         */
        mode,
        /**
         * 是否重写applicationId
         * 区分测试和生产环境的applicationId可以实现在同一台机器上同时安装测试版和正式版
         */
        shouldRewriteApplicationId,
        /**
         * 当开启重写applicationId时，需要将目前applicationId传递进来
         * applicationId在 android/app/build.gradle 文件中
         */
        applicationId,
        /**
         * 是否生成版本
         */
        generateVersion,
        /**
         * 版本号写入文件的路径
         */
        versionFilePath,
        /**
         * 'ts' | 'js'
         * 写入文件的拓展名
         */
        extname,
        /**
         * 是否生成环境变量
         */
        generateEnv,
        /**
         * 环境变量写入文件的路径
         */
        envFilePath,
        /**
         * 是否重写app安装后的显示名称
         * 常用于区分测试版还是正式版
         */
        generateAppName,
        /**
         * 打包完成后是否自动 codepush
         */
        codePush,
        /**
         * 打包完成之后是否自动打开apk所在文件夹
         */
        open,
        /**
         * 打包完成后是否自动复制一个apk文件
         * test模式会复制一个名为 app-release.test.apk
         * production 模式会复制一个名为 app-release.prod.apk
         */
        shouldCopyApp,
        /**
         * 热更时显示的更新信息
         */
        message,
        /**
         * 打包完成之后的回调
         */
        onComplete
    }
}

export async function publishReactNative({
    shouldCleanCodeChange,
    mode,
    shouldRewriteApplicationId,
    applicationId,
    generateVersion,
    versionFilePath,
    extname,
    generateEnv,
    envFilePath,
    generateAppName,
    codePush,
    open,
    shouldCopyApp,
    message,
    onComplete
}: InternalPublishConfig) {
    if (shouldCleanCodeChange) {
        let isContinue = true
        try {
            if (!await isCodeUpToDate()) {
                const answers = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'isContinue',
                        message: '检测到当前代码有未提交的，发布完成之后会执行 `git checkout .` 清除所有改动，请确认是否继续？',
                        choices: ['是', '否']
                    }
                ])
                isContinue = answers.isContinue === '是'
            }
        } catch(e) {
            // not a git repository
            // do nothing
        }

        if (!isContinue) {
            return
        }
    }

    let currentBranch: string
    try {
        currentBranch = await getCurrentBranch()
    } catch(e) {
        // not a git repository
        currentBranch = ''
    }

    const { year, month, day } = getYMD()
    const modeRes: PublishMode = typeof mode === 'function'
        ? mode(currentBranch)
        : mode
    const isTest: boolean = modeRes === 'test'

    if (shouldRewriteApplicationId) {
        if (!applicationId) {
            Promise.reject(new Error('when shouldRewriteApplicationId is true, applicationId is required'))
            return
        }

        writeBuildGradleFileByEnv(isTest, applicationId)
    }

    if (generateVersion) {
        const version = generateVersion({ year, month, day, mode: modeRes })
        await writeVersion(version, `${versionFilePath}/version.${extname}`)
    }

    if (generateEnv) {
        const env = generateEnv(modeRes)
        writeEnv(env, `${envFilePath}/env.${extname}`)
    }

    if (generateAppName) {
        const { appName, toReplaceAppName } = generateAppName(modeRes)
        if (appName !== toReplaceAppName) {
            writeAppName(appName, toReplaceAppName)
        }
    }

    await buildApk()

    if (shouldCopyApp) {
        await copyApp(isTest)
    }

    if (open) {
        await openApkDir()
    }

    if (codePush) {
        const {
            getCustomizedCommand,
            getDeploymentKey,
            getMessagePrefix,
            ownerName,
            appName
        } = codePush

        const deploymentKey = getDeploymentKey?.(modeRes)
        if (!deploymentKey) {
            Promise.reject(new Error('when enable codePush, deploymentKey is required'))
            return
        }

        const messagePrefix = getMessagePrefix?.({ year, month, day, mode: modeRes }) || ''

        await runCodePush(
            deploymentKey,
            ownerName,
            appName,
            messagePrefix,
            message,
            getCustomizedCommand
        )
    }
    
    if (shouldCleanCodeChange) {
        await cleanCodeChange()
    }

    onComplete?.(modeRes)
}
