console.log(_, $);

function notInterestingMsg(thing) { return `${thing} la, ona li lon li suli ala.` }
function commentMsg(x) { return `[sina toki tawa ala: ${x}]` }
function huhMsg() { return `seme?` }
function cantParseSentenceStartMsg() { return `o open e toki sama ni: '<b>o</b> ijo e ijo.'` }
function verbNotRelevantMsg(context) { return `sina wile ala ${context}.` }
function verbNotKnownMsg(context) { return `nimi '${context}' li toki pona ala.` }

function wordLimit() { return 3 }

function onlyNullStringOrFunction(x) {
    if (_.isUndefined(x) || _.isNull(x)) {
        return null;
    } else if (_.isString(x) || _.isFunction(x)) {
        return x;
    } else {
        throw Error(`only undefined, null, string, or function!`);
    }
}

function onlyNullArrOrFunction(x) {
    if (_.isUndefined(x) || _.isNull(x)) {
        return null;
    } else if (_.isFunction(x)) {
        return x;
    } else if (_.isArray(x)) {
        return Object.freeze(x);
    } else {
        throw Error(`only undefined, null, array, or function!`);
    }
}

function valOrCall(x) {
    return _.isFunction(x)? x() : x
}

function assertClass(x, ...classes) {
    if (classes.some(c => x instanceof c? true : false)) {
        return x
    } else {
        throw Error(`${x} must be an instance of any: ${[classes].map(c => c.name).join(', ')}`)
    }
}

class Entity {
    #look; #phrase; #long; #match;
    constructor(dict={}) { 
        this.#look = onlyNullStringOrFunction(dict.look);
        this.#phrase = onlyNullStringOrFunction(dict.phrase);
        this.#long = onlyNullStringOrFunction(dict.long);
        this.#match =  onlyNullArrOrFunction(dict.match)
        this.__parent = null;
        this.__children = new Set();
    }
    get look() { return valOrCall(this.#look) }
    get phrase() { return valOrCall(this.#phrase) }
    get long() { return valOrCall(this.#long) }
    get match() { return valOrCall(this.#match) }
    get where() { return this.__parent }
    get here() { return _.clone(this.__children) }
    get label() {
        if (!_.isNull(phrase)) {
            return this.phrase;
        } else {
            return this.long;
        }
    }
}

class Thing extends Entity {

    static #things = [];
    #isContainer; #isPortable; #isOpen; #isOpaque; 
    #isObvious;
    constructor(dict={}) {
        super(dict);
        this.#isContainer = !!dict.isContainer;
        this.#isOpen = _.isUndefined(dict.isContainer)? true : !!dict.isContainer;
        this.#isPortable = !!dict.isPortable;
        this.#isOpaque = !!dict.isOpaque;
        this.#isObvious = _.isUndefined(dict.isContainer)? true : !!dict.isObvious; 
            /* if it's not obvious, it means it'll be hidden at the start, until
            the author says it's noticed by the player. */
        Thing.#things.push(this);
    }

    get isContainer() { return this.#isContainer }
    get isPortable() { return this.#isPortable }
    get isOpen() { return this.#isOpen }
    get isOpaque() { return this.#isOpaque }
    get isObvious() { return this.#isObvious }

    arrangeAt(loc) {
        assertClass(loc, Thing, Place);
        this.__parent.__children.delete(this);
        this.__parent = loc;
        loc.__children.push(this);
    }     
}

class Place extends Entity {

    static #places = [];
    #exits = [];
    constructor(dict={}) { 
        super(dict);
        Place.#places.push(dict);
    }
    addExit(place) {
        this.#exits.push(assertClass(place, Place, Function));
        return this;
    }
    linkWith(place2) {
        this.addExit(place2);
        place2.addExit(place1);
    }
}

class Agent extends Thing {

    #scope; #noticed; #handled; #visited; #scopesMem;
    constructor(dict={}) { 
        super(dict);
        this.#scope = new Set();
        this.#noticed = new Set();
        this.#handled = new Set();
        this.#visited = new Set();
        this.#scopesMem = new Map();
    }
    get scope() { return this.#scope }
    notice(thing) { 
        assertClass(thing, Thing);
        this.#noticed.push(thing);
    }
    handle(thing) {
        assertClass(thing, Thing);
        this.#handled.push(thing);
    }
    visit(place) {
        assertClass(place, Place);
        this.#visited.push(place);
    }
    buildScope() {
        
    }
    arrangeAt(loc) {
        // super
        // rebuild scope
    }
}

function say(txt) { 
    $('.lem').append(`<p>${txt}</p>`) 
    return true;
}  

function parseFrags(words, frags) {
    const list = [];
    for (w of words) {
        if (w in frags) {
            list.push([w]);
        } else {
            list[list.length - 1].push(w);
        }
    }
    return list;
}

function pickOut(arr, callback) {
    const i = arr.findIndex(callback);
    return [arr[i], _.isUndefined(i)? arr : arr.slice(0, i).concat(arr.slice(i+1))]
}

function parseLukin(verb, rest) {
    const frags = parseFrags(rest, ['e']);
    const vo = frags.find(x => x[0] == 'e').slice(1,1+wordLimit());
    // NEXT: get scope
}

const defaultParsers = new Map();
function getParsers() { return defaultParsers };
const defaultHandlers = [];
function getHandlers() { return defaultHandlers };

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
        const words = inp.match( /\w+/g );
        if (words[0] != 'o') { 
            say(cantParseSentenceStartMsg()); 
            return;
        }
        const index = _.range(1+wordLimit(), 1, -1).find(
            i => getParsers.has(words.slice(1, i).join(' '))
        )
        /* if word limit == 3, we look at nums [4,3,2].
            we check if the slice words[1:n], joined, is a parser key.
            return the number.
        */
        if (index) {
            const verb = words.slice(1, index);
            const rest = words.slice(index + 1)
            getParsers().get(verb)(verb, rest);
        } else {
            if (tokSet.has(words[1])) {
                say(verbNotRelevantMsg(words[1]));
                return;
            } else {
                say(verbNotKnownMsg(words[1]));
                return;
            }
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
