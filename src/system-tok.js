/* parser-tok.js
   the toki pona implementation of the lon'ema system.
*/
"use strict";

// -: utility
// --------------------------------------------------------------------------------------------- //

const __ = null;
function _flattenString(str) {
   return str.match(/\S+/g).join(' ');
}
function _first(tup) {
   return tup[0];
}
function _second(tup) {
   return tup[1];
}
function _last(array) {
   return array[array.length - 1];
}
function _isDefined(o) {
   return o !== undefined;
}
function _isntNull(o) {
   return o !== null;
}
function _isFunction(x) {
   return typeof x == 'function';
}
function _isString(x) {
   return typeof x == 'string';
}
function _isBoolean(x) {
   return x === true || x === false;
}
function _isntFunction(x) {
   return !(typeof x == 'function');
}
function _isntString(x) {
   return !(typeof x == 'string');
}
function _isntBoolean(x) {
   return !(x === true || x === false);
}
function _isArray(obj) {
   return obj instanceof Array;
}
function _isNullish(x) {
   return x === undefined || x === null;
}
function _assert(x, name) {
   if (x === undefined) {
      throw new Error(`${name} is undefined!`)
   }
}

function _validate(template, obj) {
   for (const key of template) {
      const checker = template[key];
      if (_isFunction(checker)) {
         if (!checker(obj[key])) {
            throw new Error(`${key} doesn't pass predicate ${checker.name}`);
         }
      } else if (_isArray(checker) && checker.length == 2) {
         const defaulter = checker[0];
         const checkerFunc = checker[1];
         obj[key] = defaulter(obj[key]);
         if (!checker(obj[key])) {
            throw new Error(`${key} doesn't pass predicate ${checkerFunc.name}`);
         }
      } else {
         throw new Error();
      }
   }
   return obj;
}


// -: tagged templates
// --------------------------------------------------------------------------------------------- //


/* zip the strings array and the values array. However, the strings array always
   has 1 more length than values, and string[0] and string[-1] should bookend
   the reconstituted string. 
*/

function _reconstituteString(strings, values) {
   const reconstitution = [];
   values.forEach((__, ind) => {
      reconstitution.push(strings[ind]);
      reconstitution.push(values[ind]);
   });

   reconstitution.push(_last(strings));
}

function _(strings, ...values) {
   const full = _reconstituteString(strings, values);
   const words = full.match(/\S+/g);
   if (_isDefined(words)) {
      return words.join(' ');
   } else {
      return '';
   }
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
   throw new Error(
      `one of these CONFIG properties should be set to true:`
      + ` onNodeConsole, onWebConsole, onWebPlayer`)
}


// -: world
// --------------------------------------------------------------------------------------------- //


const _entityValidator = {
   descr: _isFunction,
   long: _isFunction,
   short: _isFunction,
   matches: ma => ma.every(m => _isFunction(m)),
   isObvious: [
      k => _isNullish(k)? true : k,
      _isBoolean,
   ],
};

function O(obj) {
   obj = _validate(_entityValidator, obj);
   obj.parent = null;
   obj.children = new Set();
   return obj;
}

const _containerValidator = {
   isOpaque: [
      k => _isNullish(k)? false : k,
      _isBoolean,
   ],
}

function Container(obj) {
   obj = _validate(_containerValidator, obj);
   obj.isContainer = true;
   return obj;
}

const _openableValidator = {
   isOpen: [
      k => _isNullish(k)? true : k,
      _isBoolean,
   ],
}

function 

// -: parser
// --------------------------------------------------------------------------------------------- //


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
   
   /* understand input as possible sentences (ken). pass the kenList ot a set of parsers,
      which will try to understand the input kenList in turn, until one of them
      understands it and calls an action handler. 
   */

   const words = CONFIG.matchWordsAndPunc(input);
   parseHub.parsers.some(parser => parser(words) === true);
   
   say(`I handled what I can so far.`);
   putCmdline();
}

parseHub.parsers = [];

class Result {
   constructor(value=null) {
      this.value = value;
   }
}

class Success extends Result {
   get isSuccess() { 
      return true;
   }
}
class Failure extends Result { 
   get isFailure() {
      return true;
   }
}
class Partial extends Result { 
   get isPartial() {
      return true;
   }
}

function consume(toConsume, input) {
   const startOfUnconsumed = 0;
   for (const ind in toConsume) {
      if (input[ind] == toConsume[ind]) {
         startOfUnconsumed += 1;
      } else {
         break;
      }
   }
   
   const consumedNum = startOfUnconsumed;
      // if unconsumed part starts at index 0, that means 0 tokens were consumed
   const unconsumedTokens = input.slice(startOfUnconsumed);

   if (toConsume.length == consumedNum) {
      return new Success(unconsumedTokens);
   } else if (toConsume.length == 0) {
      return new Failure(unconsumedTokens);
   } else if (toConsume.length < consumedNum) {
      return new Partial(unconsumedTokens);
   } else {
      throw new Error();
   }
}


function consumeStartingWith(toConsume, input) {
   const startResult = consume(toConsume, input);
   if (startResult.isSuccess) {
      const unconsumedTokens = [];
      return new Success(unconsumedTokens);
   } else if (startResult.isPartial || startResult.isFailure) {
      return startResult;
   } else {
      throw new Error();
   }
}

function parseLukin(words) {
   // consume o
   // consume lukin/oko
   // consume e to end
   // if e cannot be consumed, consumed tawa to end
   // if e or tawa cannot be consumed, shout a msg, return failure
   // parse unconsumed remainder as object
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




// -: testing
// --------------------------------------------------------------------------------------------- //
         
(function testParsing() {
   console.log(
      toKenList('o pana e ijo, tawa jan tawa soweli')
   )
});
   
(function testMain() {
   start(parseHub);
})();
            