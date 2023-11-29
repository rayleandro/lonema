"use strict";

class AuthorError extends Error { }

class Config {
   commandlinePrefix = 'sina seme? ';
}

class Result {}
class Success extends Result {}
class Failure extends Result {}

class Slot<T> {
   data;
   constructor(data: T) {
      this.data = data;
   }
}

const say = (x: string) => {
   const container = document.querySelector('.lem') as HTMLElement;
   const msg = document.createElement('div');
   msg.innerHTML = x;
   container.append(msg);
}

const par = (x: string) => {
   return say(`<p>${x}</p>`);
}

const flat = (x: string) => {
   const words = x.match(/\S+/g);
   return words?.join(' ') ?? "";
}

const Msg = {
   comment: (comment: string) => `[* "${comment}"]`,
   cantParse: () => `mi ken ala sona e toki sina.`,
   systemError: () => flat(
      `mi kama pakala, tan sina ala. ijo wan li pali e sijelo mi. 
      ijo ante li pali e musi, e ma, lon mi. pakala li tan pali wan.`
   ),
   authorError: () => flat(
      `mi kama pakala, tan sina ala. ijo wan li pali e sijelo mi. 
      ijo ante li pali e musi, e ma, lon mi. pakala li tan pali tu.`
   ),
   error: () => flat(
      `mi kama pakala, tan sina ala. pakala li ken tan sijelo mi, li ken tan musi mi. 
      sina pali e mi la, o lukin e ilo Web Console.`
   ),
}

class ConsumeResult extends Result {
   unconsumed;
   constructor(unconsumed: string) {
      super()
      this.unconsumed = unconsumed;
   }
}

class DidConsume extends ConsumeResult {}
class DidntConsume extends ConsumeResult {}

const consumer = (regexpStr: string) => (input: string) => {
   let re: RegExp;
   try {
      re = new RegExp(regexpStr, 'y');
   } catch (e) {
      if (e instanceof SyntaxError) {
         throw new AuthorError("consumer() arg 1: string compiles to bad regexp");
      } else {
         throw e;
      }
   }
   const result = input.match(re);
   const unconsumed = input.slice(re.lastIndex);
   return result !== null? new DidConsume(unconsumed) : new DidntConsume(unconsumed);
}

type ConditionalList<T> = Array<[T, () => boolean]>;

const resolveList = <T>(s: ConditionalList<T>): Array<T> => {
   return s.filter(tup => tup[1]() === true).map(tup => tup[0]);
}

const True = () => true;
const False = () => false;

const allTrue = <T>(arr: T[]): ConditionalList<T> => arr.map(e => [e, True]);

interface Tree<T> {
   parent: null | T;
   children: Set<T>;
}

type Matcher = (input: string) => Result;

class iEntity implements Tree<Entity> {
   parent: Entity | null = null;
   children = new Set<Entity>();
   isObvious = true;
}

interface Entity extends iEntity {
   [key: string]: unknown;
   descr: (() => string) | string;
   long: (() => string) | string;
   short: (() => string) | string;
   patterns: ConditionalList<Matcher>;
}

/* usage:
   {
      patterns: [
         [matcher("ilo toki pona"), True],
         [matcher("poki"), False],
      ]
   } 
*/
const matcher = (pattern: string): Matcher => {
   const pwords =  pattern.match(/\w+/g);
   if (pwords === null) {
      throw new AuthorError("matcher() arg 1: must be non-whitespace string with length > 1");
   }
   return (input) => {
      const [phead, ...pmods] = pwords;
      const iwords = input.match(/\w+/g);
      if (iwords === null) {
         throw new AuthorError("matcher()() arg 1: must be non-whitespace string with length > 1");
      }
      const [ihead, ...imods] = iwords;
      if (phead == ihead) {
         return new Success();
      } else if ((new Set(pmods.concat(imods))).size === pmods.length) {
         return new Success();
      } else {
         return new Failure();
      }
   }
}

const match = (ent: Entity, input: string): Result => {
   const possibleMatchers = resolveList(ent.patterns);
   return possibleMatchers.some(r => r instanceof Success)? new Success() : new Failure();
}

class iPlace {
   exits: ConditionalList<Place> = [];
}
interface Place extends Entity, iPlace {
   [key: string]: unknown;
   parent: null;
}

class iAgent {
   scope = new Set<Entity>();
   noticed = new Set<Entity>();
   handled = new Set<Entity>();
   visited = new Set<Place>();
}
interface Agent extends Entity {
   [key: string]: unknown;
   scope: Set<Entity>;
   noticed: Set<Entity>;
   handled: Set<Entity>;
   visited: Set<Place>;
}

let Player: Agent;

// TODO saver that knows how to serialize & deserialize each property

interface Subparser {
   (inp: string): Result;
}
interface Parser {
   (inp: string, subs: Subparser[]): Result;
   subparsers: Subparser[];
};

const parseTok: Parser = (raw: string, subs: Subparser[]) => {
   // TODO handle empty inputs
   const words = raw.match(/\w+|[,.*]+/g);
   if (words == null) {
      return new Success();
   }
   const input = words.join(' ');  
   const result = subs.some(p => p(input) instanceof Success);
   if (result) {
      return new Success();
   } else {
      par(Msg.cantParse());
      return new Success();
   }
}

parseTok.subparsers = [
   function parseComment(inp: string) {
      const comment = consumer('[*]')(inp);
      if (comment instanceof Success) {
         par(Msg.comment(comment.unconsumed));
         return new Success();
      } else {
         return new Failure();
      }
   },
];

const setup = (conf: Config, parser: Parser) => {
   // sets up the console divs, the input tags, event listener, etc

   const container = document.querySelector('.lem') as HTMLElement;
   console.log(container);
   const cmdline = document.createElement('form');
   cmdline.innerHTML = `
   <label for='command line'>${conf.commandlinePrefix}</label>
   <input type='text' name='command line'></input>
   `;

   const newP = () => {
      const newP = document.createElement('p');
      newP.classList.add('lem-cmdline');
      newP.append(cmdline);
      return newP;
   }
   
   container.append(newP());
   cmdline.addEventListener('keydown', function callback(ev) {
      if (ev.key == 'Enter') {
         const input = cmdline.querySelector('input') as HTMLInputElement;
         const oldP = container.querySelector('.lem-cmdline') as HTMLElement;
         oldP.classList.remove('lem-cmdline');
         oldP.removeChild(cmdline);
         oldP.textContent = `${conf.commandlinePrefix}${input.value}`;

         let errored = true; // we're assuming, until we reach the end and there's no errors thrown
         try {
            parser(input.value, parser.subparsers);
            input.value = '';
            container.append(newP());
            errored = false;
         } 
         finally {
            if (errored) {
               say(`<pre>${Msg.error()}</pre>`);
            }
         }
      };
   });
}