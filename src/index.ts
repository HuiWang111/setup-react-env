#!/usr/bin/env node --experimental-json-modules

import argsParser from 'yargs-parser';
import fs from 'fs';
import path from 'path';
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import { getCmdAndOptions } from './utils';
import { createReactProject } from './create';
import { generate } from './generate'
import { publish } from './publish'
import pkg from '../package.json';

const args = argsParser(process.argv.slice(2));

function printHelp() {
    console.info(
        fs.readFileSync(path.join(__dirname, 'helps', 'index.txt'), 'utf-8')
    );
}

function printGenerateHelp() {
    console.info(
        fs.readFileSync(path.join(__dirname, 'helps', 'generate.txt'), 'utf-8')
    );
}

function printVersion() {
    console.info(pkg.version);
}

function main() {
    const { command, options } = getCmdAndOptions(args);
    
    if (command && command.length > 0) {
        switch(command[0]) {
            case 'create': {
                clear()
                console.info(
                    chalk.yellow(figlet.textSync(
                        'setup react env',
                        { horizontalLayout: 'full' }
                    ))
                );
                
                createReactProject(path.join(__dirname, '../templetes'));
                break;
            }
            case 'generate': {
                if (options.help) {
                    printGenerateHelp()
                } else {
                    generate(command.slice(1))
                }
                break;
            }
            case 'publish': {
                publish(command.slice(1), options)
                break;
            }
            default: {
                console.info(`command '${command[0]}' not found`)
            }
        }
    } else if (options.help) {
        printHelp();
    } else if (options.version) {
        printVersion();
    }
}

main();
