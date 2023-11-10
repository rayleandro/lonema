function _flattenString(str) {
    return str.match(/\S+/g).join(' ');
}
function _isDefined(o) {
    return o !== undefined;
}
function _isntNull(o) {
    return o !== null;
}
function charIsAllowed(ch) {
    const charsets = [
        /[a-zA-Z]/, // 26 latin alphabet
        /[0-9]/,    // arabic numerals
        /\ /,       // whitespace
        /,\./,      // comma and period
    ];
    return charsets.some(re => re.exec(ch));
}
const CONFIG = {
    onNode: true,
    onWindow: false,
    charIsAllowedFunc: charIsAllowed,
}
const MSG = {
    prompt: () => `sina seme? `,
    youCommented: (txt) => `sina toki tawa ma ala: ${txt}`,
    useSentenceMarker: (txt) => `sina toki ike. o toki sama ni: '<b>o</b> ijo'`,
    invalidChars: () => _flattenString(
    	`sina sitelen ike. sitelen Lasina lili en sitelen Arabic Numerals,
    	la o kepeken ni taso.`
    ),
}
var readline, RL;
function say(msg) {
    if (CONFIG.onNode) {
        console.log(msg);
    } else if (CONFIG.onWindow) {
    }
}
function putCmdline() {
    if (CONFIG.onNode) {
        RL.prompt();
    } else if (CONFIG.onWindow) {
   }
}
function intro() {
}

function setup() {
    if (CONFIG.onNode) {
        readline = require('readline');
        RL = readline.createInterface(
                 process.stdin, process.stdout);
        RL.setPrompt(MSG.prompt());
    }
    intro();
    if (CONFIG.onNode) {
       RL.prompt();
       RL.on('line', parseHub);
    } else if (CONFIG.onWindow) {
    }
}

function parseHub(input) {
    // handling comments
    const commentRegex = /^\s*\*.*$/;
    if (commentRegex.test(input)) {
        say(MSG.youCommented(input));
        putCmdline();
        return false;
    }

    // allowed characters only
    for (ch of input) {
        if (!CONFIG.charIsAllowedFunc(ch)) {
            say(MSG.invalidChars());
            putCmdline();
            return false;
        }
    }

    // split to words, check if input's first word is o
    const words = input.match(/\w+/g);
    if (words[0] != 'o') {
        say(MSG.useSentenceMarker());
        putCmdline();
        return false;
    }



    say(`I handled what I can so far.`);
    putCmdline();
}
function parsePhrases(input) {
    let  words = input.match(/\w+|[,.]+/g);
    let kenList = [[],];
    // depth 1: list of kens
    // depth 2: list of phrases
    // depth 3: list of words

    function isPrep(word) {
        return ['tawa','lon','kepeken','tan']
        	.includes(word);
    }
    function isMarker(word) {
        return ['o','e'].includes(word);
    }
    function isStop(word) {
        return _isntNull(/[.,]/.exec(word));
    }
    function pushNewPhrase(word, ken) {
        ken.push([word]);
    }
    function pushNewEmptyPhrase(ken) {
        ken.push([]);
    }
    function lastItem(arr) {
        return arr[arr.length - 1];
    }
    function pushIntoLastPhrase(word, ken) {
        lastItem(ken).push(word);
    }

    pushNewPhrase(words.pop(), kenList[0]);

    for (w of words) {
        if (isPrep(w)) {
            const newKens = kenList.map(ken => {
                // prep as content word is used for current kens
                pushIntoLastPhrase(w, ken);
                // prep as prep is returned as new ken
                const newKen = ken.concat();
                pushNewPhrase(w, newKen);
                return newKen;
            });
            kenList = kenList.concat(newKens);
        } else if (isMarker(w)) {
            kenList.forEach(ken => pushNewPhrase(w, ken));
        } else if (isStop(w)) {
            kenList.forEach(ken => pushNewEmptyPhrase(ken));
        } else {
            kenList.forEach(ken => pushIntoLastPhrase(w, ken));
        }
    }

}
// (function main() {
//     setup()
// })()


/* -----------  testing section -------------------- */

(function () {
    console.log(
        _flattenString(`Hello
            from
            the    other*))_)( side    I,. must  , have   called
       a thousand timesssssssssssssss    `)
    );
});

(function main() {
    setup();
})();
