/**
 * Generation of images.
 */
import * as path from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import chalk from 'chalk';
import sharp from 'sharp';
import {imageSize} from 'image-size';
import {getBuildDir, getContentDir} from './paths';
import {IMAGE_SIZE, STATIC_DIR, THUMB_SIZE} from '../const';

/**
 * Process single image: copy from content to output dir, generate different sizes and thumbnails.
 * If the image is too small for a certain size, it is just symlinked.  Directory structure is kept.
 *
 * @param imagePath
 * @param force  Normally existing files are not re-generated, this forces regeneration anyway.
 */
const handleImage = async (imagePath: string, force?: boolean) => {
    const root = getContentDir(), buildDir = getBuildDir();
    const basePath = imagePath.replace(root, '');
    const outPath = buildDir + basePath;
    const out1x = outPath.replace(/\.(png|jpeg|jpg)$/, '.1x.$1');
    const out2x = outPath.replace(/\.(png|jpeg|jpg)$/, '.2x.$1');
    const outThumb = outPath.replace(/\.(png|jpeg|jpg)$/, '.t.$1');
    if (!force && fs.existsSync(outPath) && fs.existsSync(out1x) && fs.existsSync(out2x) && fs.existsSync(outThumb)) {
        return false;
    }
    fs.mkdirSync(path.dirname(outPath), {recursive: true});
    fs.copyFileSync(imagePath, outPath);
    const size = imageSize(imagePath);
    if (!size || !size.width || !size.height) {
        throw new Error(`Failed to get image size for ${basePath}, corrupted file?`);
    }

    let sizeTarget = IMAGE_SIZE, sizeThumb = THUMB_SIZE;
    let wReal = size.width, hReal = size.height;
    let w1x = wReal, w2x = wReal, h1x = hReal, h2x = hReal, wThumb = wReal, hThumb = hReal;

    // target dimensions
    let scale = 1;
    if (wReal > hReal) {
        if (hReal < sizeTarget) {
            // small enough, do nothing
        } else {
            scale = sizeTarget / hReal;
        }
    } else {
        if (wReal < sizeTarget) {
            // small enough, do nothing
        } else {
            scale = sizeTarget / wReal;
        }
    }
    w1x = Math.floor(wReal * scale);
    h1x = Math.floor(hReal * scale);

    // retina version if possible
    if (scale < 0.5) {
        w2x = w1x * 2;
        h2x = h1x * 2;
    }

    // thumbnail
    let thumbScale = 1;
    if (wReal > hReal) {
        if (hReal < sizeThumb) {
            // small enough, do nothing
        } else {
            thumbScale = sizeThumb / hReal;
        }
    } else {
        if (wReal < sizeThumb) {
            // small enough, do nothing
        } else {
            thumbScale = sizeThumb / wReal;
        }
    }
    wThumb = Math.floor(wReal * thumbScale);
    hThumb = Math.floor(hReal * thumbScale);

    // 1x
    if (!fs.existsSync(out1x)) {
        if (w1x != wReal || h1x != hReal) {
            let done = false;
            await sharp(imagePath)
                .resize(w1x, h1x)
                .toFile(out1x);
        } else {
            fs.symlinkSync(path.basename(outPath), out1x);
        }
    }

    // 2x
    if (!fs.existsSync(out2x)) {
        if (w2x != wReal || h2x != hReal) {
            await sharp(imagePath)
                .resize(w2x, h2x)
                .toFile(out2x);
        } else {
            fs.symlinkSync(path.basename(outPath), out2x);
        }
    }

    // thumb
    if (!fs.existsSync(outThumb)) {
        if (wThumb != wReal || hThumb != hReal) {
            let done = false;
            await sharp(imagePath)
                .resize(wThumb, hThumb)
                .toFile(outThumb);
        } else {
            fs.symlinkSync(path.basename(outPath), outThumb);
        }
    }
    return true;
}

/**
 * Generate all .jpg, .png images outside static dir.  Already existing in output dir images will not be re-processed.
 */
export const initImages = async () => {
    const root = getContentDir();
    console.log(`Initializing step: ${chalk.greenBright('copying/resizing images')}`);
    let processed = 0;
    const imagesFiles = fg.sync('**/*.{jpg,jpeg,png}', {absolute: true, cwd: getContentDir()});
    for (let imagePath of imagesFiles) {
        if (imagePath.startsWith(root + '/' + STATIC_DIR)) {
            // do not process inside static dir
            continue;
        }
        if (await handleImage(imagePath)) {
            console.log(`New image: ${chalk.greenBright(imagePath)}`);
            processed++;
        }
    }
    if (processed) {
        console.log(`${chalk.greenBright(processed)} image(s) processed.`)
    }
}

/**
 * Handle add/modify event on a possible image file.
 * Will re-generate forcibly images and sizes.  Modify event is potentially dangerous (misses dependencies).
 *
 * @param file
 * @param isAdd
 */
export const handleModifyImage = async (file: string, isAdd: boolean) => {
    if (!file.endsWith('.jpg') && !file.endsWith('.jpeg') && !file.endsWith('.png')) {
        return false;
    }
    if (!isAdd) {
        console.log(chalk.yellowBright('CONTENT POSSIBLY INVALIDATED: Existing image changed.  ' +
            'If its dimensions are changed, old content pages might still include it with old dimensions.  Consider full regeneration (devserver restart)'));
    }

    file = path.resolve(getContentDir(), file);
    console.log(`Image ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - copying/generating in different sizes`);
    await handleImage(file, true);
    return true;
}

/**
 * Handle remove event on a possible image file.
 * Will remove corresponding files in target dir, but is potentially dangerous (misses dependencies).
 * XXX Don't remove, it decided to delete them all once and it's a pain to regenerate those...
 *
 * @param file
 */
export const handleRemoveImage = (file: string) => {
    if (!file.endsWith('.jpg') && !file.endsWith('.jpeg') && !file.endsWith('.png')) {
        return false;
    }
    console.log(chalk.yellowBright('CONTENT POSSIBLY INVALIDATED: Existing image deleted.  ' +
        'If it was used in any content, it is broken now but not detected yet.  Consider full regeneration (devserver restart)'));
    console.log(`Image ${chalk.blueBright('remove')}: ${chalk.greenBright(file)} - not removing`);

    // file = path.resolve(getContentDir(), file);
    // const targetFile = file.replace(getContentDir(), getBuildDir());
    // const target1x = targetFile.replace(/\.(png|jpeg|jpg)$/, '.1x.$1');
    // const target2x = targetFile.replace(/\.(png|jpeg|jpg)$/, '.2x.$1');
    // const targetThumb = targetFile.replace(/\.(png|jpeg|jpg)$/, '.t.$1');
    // // ignore errors (if not exists or whatever)
    // try {
    //     fs.unlinkSync(targetFile)
    // } catch (e) {}
    // try {
    //     fs.unlinkSync(target1x)
    // } catch (e) {}
    // try {
    //     fs.unlinkSync(target2x)
    // } catch (e) {}
    // try {
    //     fs.unlinkSync(targetThumb)
    // } catch (e) {}
    return true;
}
