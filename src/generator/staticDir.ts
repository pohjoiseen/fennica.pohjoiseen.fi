/**
 * Generation (copying really) of static assets.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import chalk from 'chalk';
import {getBuildDir, getContentDir, pathResolve} from './paths';
import {STATIC_DIR} from '../const';

export const initStaticDir = () => {
    console.log(`Initializing step: ${chalk.greenBright('copying static dir')}`);
    const root = getContentDir(), buildDir = getBuildDir();
    fs.rmdirSync(buildDir + '/' + STATIC_DIR, {recursive: true});
    fsExtra.copy(root + '/' + STATIC_DIR, buildDir + '/' + STATIC_DIR, {dereference: false});
}

export const handleModifyStaticDir = (file: string) => {
    const staticDir = getContentDir() + '/' + STATIC_DIR + '/';
    file = pathResolve(getContentDir(), file);
    if (!file.startsWith(staticDir)) {
        return false;
    }
    console.log(`Static file ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - copying to build dir`);
    const targetFile = file.replace(getContentDir(), getBuildDir());
    fs.mkdirSync(path.dirname(targetFile), {recursive: true});
    fs.copyFileSync(file, file.replace(getContentDir(), getBuildDir()));
    return true;
}

export const handleRemoveStaticDir = (file: string) => {
    const staticDir = getContentDir() + '/' + STATIC_DIR + '/';
    file = pathResolve(getContentDir(), file);
    if (!file.startsWith(staticDir)) {
        return false;
    }
    console.log(`Static file ${chalk.blueBright('remove')}: ${chalk.greenBright(file)} - removing in build dir`);
    const targetFile = file.replace(getContentDir(), getBuildDir());
    fs.unlinkSync(targetFile);
    return true;
}
