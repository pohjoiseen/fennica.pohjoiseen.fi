import * as path from 'path';
import {CONTENT_DIR, OUTPUT_DIR} from '../const';

export const pathResolve = (...pathSegments: string[]) => path.resolve(...pathSegments).split(path.sep).join('/');

export const getContentDir = () => {
    return pathResolve(__dirname.split(path.sep).join('/') + '/../../' + CONTENT_DIR);
}

export const getBuildDir = () => {
    return pathResolve(__dirname.split(path.sep).join('/') + '/../../' + OUTPUT_DIR);
}
