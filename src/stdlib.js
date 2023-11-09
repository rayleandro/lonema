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
}
var readline, RL;
if (CONFIG.onNode) {
    readline = require('readline');
    RL = readline.createInterface(
             process.stdin, process.stdout);
    RL.setPrompt(MSG.prompt());
}
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

    // handling commands
    const words = input.match(/\w+/g);
    if (words[0] != 'o') {
        say(MSG.useSentenceMarker());
        putCmdline();
        return false;
    }



    say(`I handled what I can so far.`);
    putCmdline();
}
function parsePhrases(words) {

}
function setup() {
    intro();
    if (CONFIG.onNode) {
       RL.prompt();
       RL.on('line', parseHub);
    } else if (CONFIG.onWindow) {
    }
}

(function main() {
    setup()
})()
