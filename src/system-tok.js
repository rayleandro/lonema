/* parser-tok.js
   the toki pona implementation of the lon'ema system.
*/


// -: utility
// --------------------------------------------------------------------------------------------- //


function _flattenString(str) {
   return str.match(/\S+/g).join(' ');
}
function _isDefined(o) {
   return o !== undefined;
}
function _isntNull(o) {
   return o !== null;
}
function _fst(tup) {
   return tup[0];
}
function _snd(tup) {
   return tup[1];
}


// -: globals
// --------------------------------------------------------------------------------------------- //


const MSG = {
   prompt: () => `sina seme? `,
   youCommented: (txt) => `sina toki tawa ma ala: ${txt}`,
   useSentenceMarker: (txt) => `sina toki ike. o toki sama ni: '<b>o</b> ijo'`,
   invalidChars: () => _flattenString(
      `sina sitelen ike. sitelen Lasina lili en sitelen Arabic Numerals,
      la o kepeken ni taso.`
   ),
}


// -: config
// --------------------------------------------------------------------------------------------- //


if (typeof module !== 'undefined' 
      && module.exports !== undefined) {
   var CONFIG = require('./config').CONFIG;
}

   
// -: player
// --------------------------------------------------------------------------------------------- //


var 
   readline, RL,
   say, putCmdline, start
;

if (CONFIG.onNodeConsole) {

   readline = require('readline');
   RL = readline.createInterface(process.stdin, process.stdout);
   RL.setPrompt(MSG.prompt());

   say = function say(msg) {
      console.log(msg);
   }
   putCmdline = function putCmdline() {
      RL.prompt();
   }
   start = function start(parseHub, intro=() => null) {
      // TODO error handling for intro param
      intro();
      RL.prompt();
      RL.on('line', parseHub);
   }

} else if (CONFIG.onWebConsole) {
   // TODO web console implementation
} else if (CONFIG.onWebPlayer) {
   // TODO web player implementation
} else {
   throw Error(
      `one of these CONFIG properties should be set to true:`
      + ` onNodeConsole, onWebConsole, onWebPlayer`)
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
   for (const ch of input) {
      if (!CONFIG.charIsAllowedFunc(ch)) {
         say(MSG.invalidChars());
         putCmdline();
         return false;
      }
   }
   
   // understand input as possible sentences and parsers
   const understoods = understand(input);
   understoods.some((ken, parser) => parser(ken));
   
   
   
   say(`I handled what I can so far.`);
   putCmdline();
}


// -: kenlist
// --------------------------------------------------------------------------------------------- //


function toKenList(input) {
   
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
   
   let words = CONFIG.matchWordsAndPunc(input);
   let kenList = [[],];
   // depth 1: list of kens
   // depth 2: list of phrases
   // depth 3: list of words
   let stopInPrev = false;
   kenList = withNewPhrase(words[0], kenList);
   words = words.slice(1);
   
   for (const w of words) {
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


// -: grammar
// --------------------------------------------------------------------------------------------- //


/* take a string that's like "o pali .., e .., tawa .." and turn it into a
   two-item array (pair tuple). the first of the pair is the pattern, an array
   of phrases like this: [ ['o', 'pali', null], ['e', null], ['tawa', null] ]
   the second of the pair is the parser function that will be used on the input
   if it matches that pattern.
*/
function toGrammar(str, parser) {
   // TODO error handling args

   const pattern = 
      // split to phrases, like ["o pali ..", "e .."]
      str
      .split(/\s*,\s*/)
      .filter(s => s.length > 0)

      // split to words, and if word is '..' or '...', replace it with null
      .map(p => {
         const words = CONFIG.matchWordsAndDots(p);
         return words.map(w => w.test(/^\.+$/g)? null : w);
      })
   ;
   return [pattern, parser];
}

/* arg: string input
   return: [ [ken, parser], [ken, parser], ..]
*/
function understand(input) {

   // TODO error handling arg

   function grammarMatchPhrase(phrase, pI, grammar) {
      const pattern = _fst(grammar);

      for (const wI in phrase) {
         if (pattern[pI][wI] == phrase[wI]) {
            continue;
         } else if (grammar[pI][wI] == null) {
            return true;
         } else {
            return null;
         }
      }
   }
   function grammarMatchKen(grammar, ken) {
      return ken.every((phrase, pI) => grammarMatchPhrase(phrase, pI, grammar));
   }

   const kenList = toKenList(input);

   /* for each ken in kenList, look for the first grammar that matches it. if such exists,
      add it to an array that will look like this: [ [ken, parser], ..]. 
   */
   return (
      kenList.reduce((accu, ken) => {
         const grammar = understand.grammars.find(g => grammarMatchKen(g, ken));
         if (_isDefined(grammar)) {
            const parser = _snd(grammar);
            return accu.concat([ [ken, parser] ])
         } else {
            return accu;
         }
      },
      accu=[])
   );
}

understand.grammars = [];


// -: testing
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
      toKenList('o pana e ijo, tawa jan tawa soweli')
      )
});
   
(function testMain() {
   start(parseHub);
})();
            