// =====================INTERPRETER==================== //

const params = [
    'hemácias', 'hemoglobina', 'hematócrito', 'vcm', 'hcm', 'chcm', 'rdw',
    'leucócitos', 'neutrófilos', 'eosinofilos', 'basofilos', 'linfócitos típicos', 'monócitos',
    'plaq.'
];

function isLetter(c) {
    return c.toLowerCase() != c.toUpperCase();
}

function isNumeric(str) {
    if (typeof str != "string") return false; // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function fix(str) {
    let ret = '';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if ((isLetter(c) || c === '.' || c === ' ' || c === ',' | c === ':' || c === '/' || c === '\n' || c === '\t' || c === '%' || c === '³' || isNumeric(c)) && c.charCodeAt(0) !== 173) {
            ret += str[i];
        }
    }
    return ret.replace(/,/g, '.').toLowerCase().replace(/plaquetas./, 'plaq');
}

function getTokens(input) {
    const l = fix(input);
    const tokens = {};

    let b = '';
    let n = '';
    let nums = [];
    for (const c of l) {
        b += c;
        if (params.includes(b)) {
            tokens.param = b;
            b = '';
        } else if (b.charAt(b.length - 1) === ':' || b.charAt(b.length - 1) === '\t') {
            b = '';
            if (n.length > 0) {
                nums.push(parseFloat(n));
                n = '';
            }
        } else if (isNumeric(b)) {
            n += b;
            b = '';
        } else if (!isNumeric(b) && b !== '.') {
            if (n.length > 0) {
                nums.push(parseFloat(n));
                n = '';
                b = '';
            } else if (b === 'a ') { // uhh...
                b = '';
            }
        }
    }

    if (tokens.param) {
        tokens.numbers = nums;
        return tokens;
    } else {
        return undefined;
    }
}

function parseTokens(tokens) {
    if (tokens) {
        const info = {
            param: '',
            result: 0,
            min: 0,
            max: 0
        };

        if (tokens.param === 'leucócitos') {
            info.result = tokens.numbers[0] * (tokens.numbers[0] % 1 === 0 ? 1 : 1000);
            info.min = tokens.numbers[1] * 1000;
            info.max = tokens.numbers[2] * 1000;
        } else if (tokens.param === 'neutrófilos' || tokens.param === 'linfócitos típicos') {
            info.result = tokens.numbers[1] * (tokens.numbers[1] % 1 === 0 ? 1 : 1000);
            info.min = tokens.numbers[4];
            info.max = tokens.numbers[5];
        } else if (tokens.param === 'monócitos' || tokens.param === 'eosinofilos' || tokens.param === 'basofilos') {
            //TODO check format for monocytes >= 1000
            info.result = tokens.numbers[1] * (tokens.numbers[1] % 1 === 0 ? 1 : 1000);
            info.min = tokens.numbers[4];
            info.max = tokens.numbers[5];
        } else if (tokens.param === 'plaq.') {
            info.result = tokens.numbers[0] * 1000;
            info.min = tokens.numbers[1] * 1000;
            info.max = tokens.numbers[2] * 1000;
        } else {
            info.result = tokens.numbers[0];
            info.min = tokens.numbers[1];
            info.max = tokens.numbers[2];
        }

        info.param = tokens.param;
        return info;
    } else {
        return undefined;
    }
}

function getRows(source) {
    const fixed = fix(source);
    const rows = [];
    let buffer = '';
    for (const character of fixed) {
        if (character === '\n') {
            if (buffer.length > 1) {
                rows.push(buffer + '\n');
                buffer = '';
                continue;
            }
        }
        buffer += character;
    }

    return rows;
}

function getAllInfos(source) {
    const infos = [];
    const rows = getRows(source);
    for (const r of rows) {
        const tokens = getTokens(r);
        if (tokens) {
            const info = parseTokens(tokens);
            if (info) {
                infos.push(info);
            }
        }
    }
    return infos;
}

// =====================CHECKER==================== //

const alterations = {
    'hemácias': { low: 'hemácias baixas', high: 'hemácias altas' },
    'hemoglobina': { low: 'hemoglobina baixa', high: 'hemoglobina alta' },
    'hematócrito': { low: 'hematócrito baixo', high: 'hematócrito alto' },
    'vcm': { low: 'VCM baixo', high: 'VCM alto' },
    'hcm': { low: 'HCM baixo', high: 'HCM alto' },
    'chcm': { low: 'CHCM baixo', high: 'CHCM alto' },
    'rdw': { low: 'RDW baixo', high: 'RDW alto' },
    'leucócitos': { low: 'leucopenia', high: 'leucocitose' },
    'neutrófilos': { low: 'neutropenia', high: 'neutrofilia' },
    'eosinofilos': { low: '', high: 'eosinofilia' },
    'basofilos': { low: '', high: 'basofilia' },
    'linfócitos típicos': { low: 'linfocitopenia', high: 'linfocitose' },
    'monócitos': { low: '', high: 'monocitose' },
    'plaq.': { low: 'trombocitopenia', high: 'trombocitose' }
};

function getCheckings(infos) {
    const foundAlterations = [];
    for (const i of infos) {
        if (i.result < i.min) {
            foundAlterations.push(alterations[i.param].low);
        } else if (i.result > i.max) {
            foundAlterations.push(alterations[i.param].high);
        }
    }
    return foundAlterations;
}

// const laud =
//     "HE­MO­GRA­MA\n" +
//     "Mé­to­do: Au­to­ma­ti­za­do   Ma­te­rial: San­gue ED­TA   Co­le­ta­do em: 30/12/2020\n" +
//     "Li­be­ra­do por:   Li­be­ra­do em:\n" +
//     " \n" +
//     "ERI­TRO­GRA­MA\tVa­lo­res de Re­ferên­cia\n" +
//     "Hemá­cias.....................:\t4,33 mi­lhões/ mm³\t   3,9 a 5,0 /mm³\n" +
//     "He­mo­glo­bi­na..................:\t13,1 g/dL\t   11,5 a 15,5 g/dL\n" +
//     "He­mató­cri­to..................:\t40,3 %\t35,0 a 45,0 %\n" +
//     "VCM..........................:\t93,1 fl\t 80,0 a 96,0 fl\n" +
//     "HCM..........................:\t30,3 pg\t 26,0 a 34,0 pg\n" +
//     "CHCM.........................:\t32,5 g/dL\t   31,0 a 36,0 g/dL\n" +
//     "RDW..........................:\t13,9\t11,0 a 15,0 %\n" +
//     "\n" +
//     " \n" +
//     "LEU­CO­GRA­MA\n" +
//     "Leucó­ci­tos...................:\t6.430/mm³\t4.000 a 10.000/mm³\n" +
//     " \t%\t/mm³\n" +
//     "Neu­tró­fi­los..................:\t72,9%\t4.687/mm³\t50 a 70\t2000 a 7000\n" +
//     "Pro­mie­lo­ci­tos................:\t0,0%\t0/mm³\t0\t0\n" +
//     "Mie­lo­ci­tos...................:\t0,0%\t0/mm³\t0\t0\n" +
//     "Me­ta­mie­lo­ci­tos...............:\t0,0%\t0/mm³\t0\t0\n" +
//     "Bastões......................:\t0,0%\t0/mm³\t0 a 6\t  0 a 600\n" +
//     "Seg­men­ta­dos..................:\t72,9%\t4.687/mm³\t50 a 70\t2000 a 7000\n" +
//     "Eo­si­no­fi­los..................:\t1,0%\t64/mm³\t2 a 4\t 80 a 600\n" +
//     "Ba­so­fi­los....................:\t0,4%\t26/mm³\t0 a 2\t  0 a 200\n" +
//     "Linfó­ci­tos tí­pi­cos...........:\t16,0%\t1.029/mm³\t25 a 35\t 1000 a 3500\n" +
//     "Linfó­ci­tos atí­pi­cos..........:\t0,0%\t0/mm³\t0\t0\n" +
//     "Monó­ci­tos....................:\t9,7%\t624/mm³\t 2 a 10\t400 a 1000\n" +
//     "Blas­tos......................:\t0,0%\t0/mm³\t0\t0\n" +
//     "\n" +
//     " \n" +
//     "PLA­QUE­TAS\n" +
//     "Pla­que­tas....................:\t82.000/mm³\t150.000 a 450.000/mm³\n" +
//     "VPM..........................:\t14,3/fL\t6,7 a 10,0fL\n" +
//     "Pla­quetó­cri­to................:\t0,12%\t0,10 a 0,50%\n" +
//     "PDW..........................:\t16,7\t15,0 a 17,9%\n" +
//     "\n" +
//     " ";
