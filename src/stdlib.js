// -- utility functions
// ----------------------------------------------------- //

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

// -- globals
// ----------------------------------------------------- //

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

// -- console
// ----------------------------------------------------- //

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

// -- game loop
// ----------------------------------------------------- //

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

// -- parsing
// ----------------------------------------------------- //

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

    // parse possible phrases from input
    const kenList = parsePhrases(input);



    say(`I handled what I can so far.`);
    putCmdline();
}

function parsePhrases(input) {

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
    function withNewPhrase(word, kenList) {
        return kenList.map(ken => ken.concat([ [word] ]));
    }
    function withNewEmpty(kenList) {
        return kenList.map(ken => ken.concat([ [] ]));
    }
    function withLastPhraseHaving(word, kenList) {
        return kenList.map(ken => {
            const initPhrases = ken.slice(0, -1);
            const last = ken.slice(-1);
            const newLast = [ last[0].concat([ word ]) ];
            return initPhrases.concat(newLast);
        });
    }

    let words = input.match(/\w+|[,.]+/g);
    let kenList = [[],];
    // depth 1: list of kens
    // depth 2: list of phrases
    // depth 3: list of words
    let stopInPrev = false;
    kenList = withNewPhrase(words[0], kenList);
    words = words.slice(1);

    for (w of words) {
        if (isPrep(w)) {
            if (stopInPrev) {
                kenList = withLastPhraseHaving(w, kenList);
            } else {
                const newKenList = withNewPhrase(w, kenList.concat());
                kenList = withLastPhraseHaving(w, kenList).concat(newKenList);
            }
        } else if (isMarker(w)) {
            kenList = withNewPhrase(w, kenList);
        } else if (isStop(w)) {
            kenList = withNewEmpty(kenList);
            stopInPrev = true;
            continue;
        } else {
            kenList = withLastPhraseHaving(w, kenList);
        }
        stopInPrev = false;
    }
    return kenList;
}

// -- testing
// ----------------------------------------------------- //

(function () {
    console.log(
        _flattenString(`Hello
            from
            the    other*))_)( side    I,. must  , have   called
       a thousand timesssssssssssssss    `)
    );
});

(function testParsing() {
    console.log(
        parsePhrases('o pana e ijo, tawa jan tawa soweli')
    )
})();

(function main() {
    setup();
});
