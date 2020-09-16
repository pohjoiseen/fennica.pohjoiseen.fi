import * as path from 'path';
import {CONTENT_DIR, OUTPUT_DIR} from '../const';

export const getContentDir = () => {
    return path.resolve(__dirname + '/../../' + CONTENT_DIR)
}

export const getBuildDir = () => {
    return path.resolve(__dirname + '/../../' + OUTPUT_DIR);
}
