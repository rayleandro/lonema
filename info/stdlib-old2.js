
// checking if my modules work
console.log(_, $);

const options = {
    commandLinePrefix: `sina seme? `,
}

const msg = {
    notInteresting: (thing) => `${thing} la, ona li lon li suli ala.`,
    comment: (x) => `[sina toki tawa ala: ${x}]`,
    huh: () => `seme?`,
}

// utils functions that i really want to delete at the end of the script
function isEither(x, ...testProtos) {
    // x must be an instance of any of the testProtos
    return testProtos.find(p => x instanceof p) != undefined;
}
function assertEntity(x, context) {
    if (!(x instanceof Thing || x instanceof Place)) {
        throw Error(`${context != undefined? context : ''} must be a Thing/Place!!!`)
    }
}
function valOrCallback(x) {
    if (x instanceof Function) return x()
    else return x
}


function appendToHTMLConsole(stringOrJQuery) {
    let container = $('.lem');
    container.append(stringOrJQuery);
}

function say(txt) { appendToHTMLConsole($( `<p>${txt}</p>` )) }

class Thing {
    static _things = {};
    constructor (dict) {
        let things = Thing._things;
        if (dict == undefined) { return this }
        if (dict.id == undefined) things[ Object.keys(things).length ] = this;
        else if (dict.id.toString() in things) throw Error(`${dict.id} already defined`);
        else things[dict.id.toString()] = this;

        this._look = dict.look; // string or callback
        this._isContainer = dict.isContainer; // boolean
        this._isPortable = dict.isPortable; // boolean
        this._parent = undefined; // Thing or Place
        this._children = []; // arr of Things

        if (dict.match == undefined 
            || dict.match instanceof Function || dict.match.length > 0)
             this.match = dict.match;
        else throw Error("match must be a function or a valid array");

        this._phrase = dict.phrase;
        this._longDesc = dict.longDesc;
    }

    get where() { return this._parent }
    get held() { return this._children }
}

class Place {
    static _places = {};
    constructor (dict) {
        let places = Place._places;
        if (dict.id == undefined) places[ Object.keys(places).length ] = this;
        else if (dict.id.toString() in places) throw Error(`${dict.id} already defined`);
        else places[dict.id.toString()] = this;

        this._look = dict.look; // string or callback
        this._children = []; // set of Things
        this._exits = [];

        if (dict.match == undefined 
            || dict.match instanceof Function || dict.match.length > 0)
             this.match = dict.match;
        else throw Error("match must be a function or a valid array");

        this._phrase = dict.phrase; 
        this._longDesc = dict.longDesc;
    }
    connect(...args) {
        // each arg is either a valid Place or a callback that returns a Place
        args.forEach(a => {
            if (isEither(a, Place, Function))
                this._exits.push(a);
            else throw Error(`args must be either Places or callbacks that return Places`);
        });
    }   
    static connect(args) {
        if (!(args.at(-1) instanceof Function)) {
            throw Error(`last arg must be a callback`);
        }
        args.slice(0, -1).forEach((e) => {
            if (e instanceof Place)
                e._exits.push(args.at(-1));
            else   
                throw Error(`first args must be Places`);
        })
    }
    static link(loc1, loc2) {
        if (loc1 instanceof Place && loc2 instanceof Place) {
            loc2._exits.push(loc1);
            loc1._exits.push(loc2);
        } else {
            throw Error(`args must be Places`)
        }
    }
    //  put all of these outside the function
}

function arrange(thing, holder) {
    if (thing instanceof Thing && isEither(holder, Thing, Place)) {
        thing._parent = holder;
        holder._children.push(thing);
    } else {
        throw Error(`arg 1 must be Thing, arg 2 must be Thing/Place`)
    }
}

function labelEntity(e) {
    /* based on context, based on phrase and longDesd properties, return
    a label to be printed for the entity */
    assertEntity(e);
    if (e._phrase == undefined) throw Error(`no phrase for this entity!`);
    return valOrCallback(e._phrase).toString();
}

function sayLook(entity) {
    if (isEither(entity, Thing, Place)) {
        if (entity instanceof Place) {
            say(`<b>${labelEntity(entity)}.</b>`);
            say(valOrCallback(entity._look));
        } else {
            if (entity._look == undefined) {
                say(msg.notInteresting(entity._phrase));
            } else {
                say(valOrCallback(entity._look));
            }
        }
    } else {
        throw Error(`can't look at not thing/place!`)
    }
}

function makePlaceIterator(place) {
    /* return an iterator that iterates thru the object tree. it can
    also restart the iterator back at level 1. when iterating, next()
    returns a thing and the level it's in */
    if (!(place instanceof Place)) { throw Error(`arg must be Place`) }
    let stack = Array.from(place._children);
    return {
        next() {
            let cur = stack.pop()
            if (cur != undefined) {
                stack.concat(cur._children);
            } 
            return cur;

        },
        restart() {
            stack = Array.from(place._children);
        }
    }
}

function thingsInPlace(allLevels=false) {
    // traverses tree.
}

const player = new Thing();
function place() { 
    return player._parent 
}
function setup() {
    if (!(place() instanceof Place)) {
        throw Error(`put your player in a room!!!`);
    }
    sayLook(player._parent); 
}

function HTMLPlayLoop() {
    // sets up the console divs, the input tags, event listener, etc
    setup();
    let container = $('.lem');
    let cmdline = `
    <p class='lem-cmdline'>
        <label for='command line'>${options.commandLinePrefix}</label>
        <input type='text' name='command line' autofocus></input>
    </p>
    `
    container.append(cmdline);
    let callback = e => {
        if (e.isComposing) return
        if (e.key == 'Enter') {
            console.log('enter!!!');
            let oldCmdLine = $('.lem-cmdline');
            let input = oldCmdLine.find('input').val();
            console.log(`input: ${input}`);
            oldCmdLine.html(`${options.commandLinePrefix}${input}`)
                      .removeClass('lem-cmdline');
            parse(input);
            container.append(cmdline);
            $('.lem-cmdline input').keydown(callback);
        }
    };
    $('.lem-cmdline input').keydown(callback);
}

const patterns = {
    look(head, )
}

function parse(inp) {
    if (/^\s*\*.*$/.test(inp)) {
        say(msg.comment(inp));
    }
    else if (inp == '') {
        say(msg.huh());
    } else {

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