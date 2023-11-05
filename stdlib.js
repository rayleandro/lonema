console.log(_, $);

const $State = {
   things : new Set(), places : new Set(), player: null
}

function notInterestingMsg(thing) { return `${thing} la, ona li lon li suli ala.` }
function commentMsg(x) { return `[sina toki tawa ala: ${x}]` }
function huhMsg() { return `seme?` }
function cantParseSentenceStartMsg() { return `o open e toki sama ni: '<b>o</b> ijo e ijo.'` }
function verbNotRelevantMsg(context) { return `sina wile ala ${context}.` }
function verbNotKnownMsg(context) { return `nimi '${context}' li toki pona ala.` }

function wordLimit() { return 3 }

function assert_(bool, msg) {
   if (!bool) { throw Error(msg) }
} // TODO mix in with underscore.js?

const RE_WORDS = /\w+/g;
const RE_SLASH = /\s*\/\s*/;

function make(args) {
   // TODO error handling
   let obj, depends;
   [obj, depends] = args.reduce(
      (accumulator, arg) => {
         return [
            Object.assign(accumulator[0], arg),
            _.isUndefined(arg.__depends) ? accumulator[1]
                                         : accumulator[1].concat(arg.__depends) 
         ]
      },
      accumulator=[ {}, [] ]
   );
   depends.forEach(
      d => assert_(_.has(obj, d), 
         `make(): no arg supplied a '${d}' method, which is required by other methods`)
   );
   assert_(_.has(obj, 'getPatterns') || _.has(obj, 'match'), 
      `make(): no arg supplied a 'getPatterns' or 'match' method, which is required by the parser`);
   ['getDescr', 'getPhrase', 'getLong', 'getLook'].forEach(
      d => assert_(_.has(obj, d), 
         `make(): no arg supplied a '${d}' method, which is required by the parser`)
   );
   return obj;
}

function descr(x) {
   assert_(_.isString(x) || _.isFunction(x),
      `descr(): first arg '${x}' should be a str or func`);
   return {
      getDescr() { return _.isFunction(x)? x() : x }
   }
}

function phrase(x) {
   assert_(_.isString(x) || _.isFunction(x),
      `phrase(): first arg '${x}' should be a str or func`);
   return {
      getPhrase() { return _.isFunction(x)? x() : x }
   }
}

function long(x) {
   assert_(_.isString(x) || _.isFunction(x),
      `long(): first arg '${x}' should be a str or func`);
   return {
      getLong() { return _.isFunction(x)? x() : x }
   }
}

function look(x) {
   assert_(_.isString(x) || _.isFunction(x),
      `look(): first arg '${x}' should be a str or func`);
   return {
      getLook() { return _.isFunction(x)? x() : x }
   }
}

function matchPat(x) {
   assert_(_.isString(x),
      `matchPat(): first arg '${x}' should be a str`);

   const patterns = x.split(RE_SLASH)
      .reduce((accu, s) => {
         const words = s.match(RE_WORDS);
         return (
            words.length > 1 ? 
               accu.set(words[0], new Set(words.slice(1)))
            : words.length > 0 ?
               accu.set(words[0], null)
            : accu
         );
      },
      accu=new Map());
   
   return {
      getPatterns() { return patterns },
   }
}

function matchFunc(x) {
   assert_(_.isFunction(x), 
      `matchFunc(): first arg '${x}' should be a function`);
   return {
      match: x,
   }
}

function spatial() {
   return {
      __parent: null,
      __children: new Set(),
      where() { return this.__parent },
      here() { return _.clone(this.__children) },
      address() {
         return (
            this.__parent != null ? [this].concat(this.address())
                                  : []
         );
      },

      listAllHere(include=() => true) {

         assert_(_.isFunction(include), 
            `listAllHere takes 1 arg: callback: (param1) => boolean`);
         assert_(include.length > 1,
            `callback arg should take only 0-1 args`);
         
         function goBoy(tree) {
            return (
               !include(tree) ? []
               : tree.__children == [] ? [tree]
               : [tree].concat(goThru(tree.__children))
            )
         }
         function goThru(arr) {
            const head = arr.slice(0,1);
            const tail = arr.slice(1);
            return (
               arr.length == 0 ? []
               : goBoy(head).concat(goThru(tail))
            )
         }

         return goBoy(this);

      },

      arrangeAt(loc) {
         assert_(!_.isUndefined(loc.__parent), `arg for arrangeAt must have .__parent`);
         assert_(!_.isUndefined(loc.__children), `arg for arrangeAt must have .__children`);
         
         this.__parent.__children.delete(this);
         this.__parent = loc;
         loc.__children.push(this);
         return this; // chainable/pipeable
      },
   }
}

function place() {
   return {
      __depends: ['__parent', '__children'],

      isPlace() { return true },
      __exits: [],

      addExit(place) {
         assert_(place.isPlace() || _.isFunction(place),
            `addExit takes a Place or a function`);

         this.__exits.push(place);
         return this;
      },

      linkWith(place2) {
         assert_(place2.isPlace(),
            `linkWith takes a place`);

         this.addExit(place2);
         place2.addExit(this);
         return this;
      },

      arrangeAt() {  } //TODO throw error here
   }
}

function container(dict) {
   const keys = new Set(['isOpaque', 'isClosed']);
   assert_(Object.keys(dict).every(k => keys.has(k)));
   return {
      __depends: ['__parent', '__children'],
      __closed: !!dict.isClosed || false,

      isContainer() { return true },
      isOpaque() { return !!dict.isOpaque },
      isClosed() { return this.__closed },
   }
}

function agent() {
   return {
      __depends: ['__parent', '__children','address', 'arrangeAt', 'listAllHere'],
      isAgent() { return true },
      __scope: new Set(),
      __noticed: new Set(),
      __handled: new Set(),
      __visited: new Set(),
      getRoom() {
         return address.slice(-1)[0];
      },

      matchesInScope(wordArr) {
         function wordsMatchSet(words, set) {
            return words.slice(1).every(w => set.has(w));
         }

         function wordsMatchThing(words, thing) {
            const head = words[0];
            return (
               _.has(thing, 'match') ? 
                  thing.match(words)
               : thing.getPatterns().has(head) ? 
                  wordsMatchSet(words, thing.getPatterns().get(head))
               : false
            );
         }

         return (function recurse(words, accumulator, iterator) {
            const thing = iterator.next().value;
            return (
               _.isUndefined(thing) ? 
                  accumulator
               : wordsMatchThing(wordArr, thing) ?
                  recurse(words, [thing].concat(accumulator), iterator)
               : recurse(words, accumulator, iterator)
            );

         })(wordArr, [], this.__scope[Symbol.iterator]());
      },

      thingInScope() {},
      // TODO other scope stuff
      notice(thing) {
         // TODO error handling
         this.__scope.add(thing);
      },
      handle() {},
      visit() {},
      hasNoticed(t) { return this.__noticed.has(t) },

      buildScope() {
         this.__scope.clear();
         const pred = (l => 
            l.isPlace? true 
            : l.isOpaque && l.isClosed? false
            : true
         );
         const ceiling = (
            function up(prev) {
               return (
                  !_.isNull(prev.__parent) && pred(prev.__parent) ? 
                     up(prev.__parent)
                  : prev
               );
            }
         )(this);
         ceiling.listAllHere(t => this.hasNoticed(t))
            .forEach(x => this.__scope.add(x));
      },

      move() {} // better arrangeAt with auto building scope
   }
}

function player() { return $State.player };

function say(txt) { 
   $('.lem').append(`<p>${txt}</p>`) 
   return true;
}  

function parsePhrases(words) {
   const preps = new Set(["tawa","lon","kepeken","tan"]);
   const markers = new Set(["o","e"]);
   function giveTail (word, arr) {
      const init = arr.slice(0, -1);
      const last = arr.slice(-1);
      return init.concat([last[0].concat([word])]);
   }
   function addToPhrase(word, kenList) {
      return kenList.map(k => giveTail(word, k))
   }
   function addEmptyAndPhrase(word, kenList) {
      return kenList.map(k => k.concat([[word]]))
   }
   function addWord(accu, word) {
      return (
         preps.has(word) ?
            addToPhrase(word, accu).concat(addEmptyAndPhrase(word, accu))
         : markers.has(word) ?
            addEmptyAndPhrase(word, accu)
         : addToPhrase(word, accu)
      );
   }
   return words.reduce(addWord, [[]]);
} // WORKS!!

function disambiguateVO(question, thingsArr) {
   const phrases = thingArr.map(t => t.getPhrase());
   function searchExceptIn(elem, index, list) {
      const before = list.slice(0, index);
      const after = list.slice(index+1);
      return before.includes(elem) || after.includes(elem);
   }
   function label(thing, index) {
      const long = thing.getLong()
      if (!_.isEmpty(phrases[index])) {
         if (searchExceptIn(phrases[index], index, phrases)) {
            return `<li>`
               + `e ${phrases[index]}`
               + (_.isEmpty(long)? `` : ` ni: ${long}`)
               + `</li>`
         } else {
            return `<li>`
               + `e `
         }
      } else if (!_.isEmpty(long)) {

      } else {

      }
   }
   const lines = thingsArr.map(label);
}

function parseLukin(phrases) {
   const sentence = _.sortBy(phrases, 'length')[0];
   const vo = sentence[1].slice(1, 1+wordLimit());
   const things = player().matchesInScope(vo);
   // TODO get scope for parseLukin
}

function getParsers() { return new Map() };
function getHandlers() { return new Map() };

function parseFunction(inp) {
   // thank you linku.la!!
   const tokSet = new Set(['a', 'aka', 'akesi', 'ako', 'ala', 'alasa', 'ale', 'alente', 'ali', 'alu', 'anpa', 'ante',
   'anu', 'apeja', 'awase', 'awen', 'e', 'eki', 'eliki', 'en', 'enko', 'epiku', 'esun', 'ete', 'ewe', 'i', 
   'ijo', 'ike', 'iki', 'ilo', 'insa', 'ipi', 'isipin', 'itomi', 'jaki', 'jaku', 'jalan', 'jami', 'jan',
   'jans', 'jasima', 'je', 'jelo', 'jo', 'jonke', 'ju', 'jule', 'jume', 'kala', 'kalama', 'kalamARR',
   'kalijopilale', 'kama', 'kamalawala', 'kan', 'kapa', 'kapesi', 'kasi', 'ke', 'ken', 'kepeken', 'kepen',
   'kese', 'ki', 'kijetesantakalu', 'kiki', 'kili', 'kin', 'kipisi', 'kisa', 'kiwen', 'ko', 'kokosila', 
   'kon', 'konsi', 'konwe', 'kosan', 'ku', 'kule', 'kulijo', 'kulu', 'kulupu', 'kuntu', 'kute', 'kutopoma',
   'la', 'lanpan', 'lape', 'laso', 'lawa', 'leko', 'len', 'lete', 'li', 'lijokuku', 'likujo', 'lili', 
   'linja', 'linluwi', 'lipu', 'lo', 'loje', 'loka', 'lokon', 'lon', 'lu', 'luka', 'lukin', 'lupa', 'ma', 
   'majuna', 'mama', 'mani', 'meli', 'melome', 'meso', 'mi', 'mije', 'mijomi', 'misa', 'misikeke', 'moku',
   'moli', 'molusa', 'monsi', 'monsuta', 'mu', 'mulapisu', 'mun', 'musi', 'mute', 'n', 'nalanja', 'namako', 
   'nanpa', 'nasa', 'nasin', 'natu', 'neja', 'nele', 'nena', 'ni', 'nimi', 'nimisin', 'nja', 'noka', 'nu', 
   'o', 'ojuta', 'oke', 'okepuma', 'oki', 'oko', 'olin', 'omekalike', 'omekapo', 'omen', 'ona', 'oni', 'open',
   'owe', 'pa', 'pakala', 'pake', 'pakola', 'pali', 'palisa', 'pan', 'pana', 'pasila', 'pata', 'peta', 'peto', 
   'pi', 'pika', 'pilin', 'pimeja', 'Pingo', 'pini', 'pipi', 'pipo', 'po', 'poka', 'poki', 'polinpin', 
   'pomotolo', 'pona', 'poni', 'powe', 'pu', 'puwa', 'sama', 'samu', 'san', 'seli', 'selo', 'seme', 'sewi', 
   'sijelo', 'sike', 'sikomo', 'sin', 'sina', 'sinpin', 'sipi', 'sitelen', 'slape', 'soko', 'sona', 'soto', 
   'soweli', 'su', 'suke', 'suli', 'suno', 'supa', 'sutopatikuna', 'suwi', 'taki', 'tan', 'taso', 'tawa', 'te',
   'teje', 'telo', 'ten', 'tenpo', 'to', 'tokana', 'toki', 'toma', 'tomo', 'tonsi', 'tu', 'tuli', 'u', 'umesu',
   'unpa', 'unu', 'usawi', 'uta', 'utala', 'wa', 'waleja', 'walo', 'wan', 'waso', 'wasoweli', 'wawa', 'wawajete',
   'we', 'we1', 'weka', 'wekama', 'wi', 'wile', 'wuwojiti', 'yupekosi', 'yutu']);
   
   if ( /^\s*\*.*$/ .test(inp)) {
      say(commentMsg(inp));
      return;
   } else if ( /^\s*$/ .test(inp) ) {
      say(huhMsg());
      return;
   } else {
      const words = inp.match( RE_WORDS );
      if (words[0] != 'o') { 
         say(cantParseSentenceStartMsg()); 
         return;
      }
      // TODO get phrases, get parser for verb head
      const phrasesKen = parsePhrases(words);
      const verbs = phrasesKen[0][0].slice(1);
      const parser = verbs.reduce(
         (accu) => {
            if (!_.isNull(accu.value)) { 
               return accu 
            } else {
               const parserKen = getParsers().get(accu.test.join(' '));
               return _.isUndefined(parserKen) ? {test: verbs.slice(0, -1), value: null}
                                               : {test: null, value: parserKen};
            }
         },
         {test: verbs, value: null}
      ).value;
      if (!_.isNull(parser)) {
         parser(phrasesKen);
      } else if (tokSet.has(words[1])) {
         say(verbNotRelevantMsg(words[1]));
         return;
      } else {
         say(verbNotKnownMsg(words[1]));
         return;
      }
   }
      
      // takes a string of text
      // parses the text into actions or commands
      // handles each action: *before phase, instead phase, prevent phase, perform phase, after phase*
      // * means all rules in that phase are exhausted.
      // before rules are for extra things to set up, or saying things before the PC
      // attempts to do the action
      // instead phase is for diverting actions. if an instead rule fires, the next phases are skipped.
      // meanwhile prevent rules prevent you from eating inedible things,
      // taking things that can't be taken, etc
      // if a prevent rule fires, the next phases are skipped.
      // perform rules are used to perform the actions
      // after is for saying things or extra things to set up.
   }
   
function cmdLinePrefix() { return `sina seme? ` }

function HTMLPlayLoop() {
   // sets up the console divs, the input tags, event listener, etc
   let container = $('.lem');
   let cmdline = `
   <p class='lem-cmdline'>
   <label for='command line'>${cmdLinePrefix()}</label>
   <input type='text' name='command line' autofocus></input>
   </p>
   `
   container.append(cmdline);
   let callback = (e) => {
      if (e.isComposing) return
      if (e.key == 'Enter') {
         console.log('enter!!!');
         let oldCmdLine = $('.lem-cmdline');
         let input = oldCmdLine.find('input').val();
         console.log(`input: ${input}`);
         oldCmdLine.html(`${cmdLinePrefix()}${input}`)
         .removeClass('lem-cmdline');
         parseFunction(input);
         container.append(cmdline);
         $('.lem-cmdline input').keydown(callback);
      }
   };
   $('.lem-cmdline input').keydown(callback);
}
