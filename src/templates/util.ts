import {COATOFARMS_DEFAULT_SIZE} from '../const';

export const normalizeCoatsOfArms = (coatsOfArms?: string | [string, number] | ((string | [string, number])[])) => {
    let result: [string, number][];
    if (!coatsOfArms) {
        result = [];
    } else if (typeof coatsOfArms === 'string') {
        result = [[coatsOfArms, COATOFARMS_DEFAULT_SIZE]];
    } else if (typeof coatsOfArms[0] === 'string' && typeof coatsOfArms[1] === 'number') {
        result = [[coatsOfArms[0], coatsOfArms[1]]];  
    } else {
        result = (coatsOfArms as (string | [string, number])[]).map((coa: string | [string, number]) => {
            if (typeof coa === 'string') {
                return [coa, COATOFARMS_DEFAULT_SIZE];
            }
            return coa;
        });
    }
    return result;
}