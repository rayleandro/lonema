class maError extends Error {
   constructor (msg) {
      super(msg);
   }
}

ma = {
   msg: (function (key, ...params) {
      if (ma.msgs[key] instanceof Function) {
         return ma.msgs[key](...params).toString();
      } else if (ma.msgs[key] === undefined) {
         throw new maError(`No such message: ${key}`);
      } else {
         return ma.msgs[key].toString();
      }
   }),
   msgs: {
      invalidGrammar: (x) => `toki sina ni li pona ala: ${x}` 
   },
   write() {},
   parse() {
      /* if there's a typo in one of the sentences, send an error message without
      executing any of the sentences */
   },
   getSentences(cmd) {
      /* split on punctuation, and just before the 'o' */
      let sentences = [[]];
      let addCh = (ch) => { sentences[sentences.length - 1].push(ch) }
      let addSent = () => { sentences.push([]) }
      
      let onSent = false;
      let started = false;
      
      let s = /s/
      let o = 'o'
      let part = new Set(['o', 'e', 'lon', 'tan', 'sama', 'kepeken', 'tawa'])

      for (ch of cmd) {
         if (s.test(ch)) continue
         if (!started)  {
            if (ch == o)   {
               started = true;
               onSent = true;
               addCh(ch);
            } else {
               
            }
         }
      }
   },

   play() {
      let dom = document;
      let pre = `sina seme? `
      let container = dom.querySelector('ma-container');

      let inDiv = dom.createElement('div');
      let label = dom.createElement('label');
         label.setAttribute('for', 'command inDiv');
         label.textContent = pre;
      let input = dom.createElement('input');
         input.setAttribute('type', 'text');
         input.setAttribute('name', 'command inDiv');
      inDiv.append(label, input);

      inDiv.addEventListener('keydown', (event) => {
         if (event.isComposing) return; // composing unicode characters
         if (event.key == 'Enter') {
            inDiv.innerHTML = '';
            inDiv.textContent = pre + input.textContent;
            data = ma.parse(input.textContent);
            let outDiv = dom.createElement('div');
            outDiv,
            ner.appendChild(outDiv);
            input.textContent = '';
            container.appendChild(
               dom.createElement('div')
                  .append(label, input)
            );
         }
      });

      container.appendChild(inDiv);
   },
}