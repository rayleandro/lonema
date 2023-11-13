/* config.js
   configuration defaults. override these by setting the CONFIG object's keys.
*/


const CONFIG = {
   
   /* Node console, web console, and web player are the only modes of play supported.
      Node & web consoles are only meant for testing purposes. Please set only one of these
      to true.
   */
   onNodeConsole: true,
   onWebConsole: false,
   onWebPlayer: false,
   
   /* Do you want to use more characters than the 26 latin letters and arabic numerals?
      Change these functions! First, modify or add to the regex patterns in 
      the charsets of this charIsAllowedFunc. Then, change the regex patterns
      in matchWordsAndPunc, and matchWordsAndDots. These two functions should return
      an array of strings.
   */
  
   charIsAllowedFunc(ch) {
      const charsets = [
         /\w/,    // 26 latin alphabet
         /[0-9]/, // arabic numerals
         /\ /,    // whitespace
         /[,.]/,  // comma and period
      ];
      return charsets.some(re => re.exec(ch));
   },
   matchWordsAndPunc(str) {
      return str.match(/\w+|[0-9]+|[,.]+/g);
   },
   matchWordsAndDots(str) {
      return str.match(/\w+|[0-9]+|\.+/g);
   }

}


if (typeof module !== 'undefined' 
      && module.exports !== undefined) {
   module.exports = { CONFIG, }
}
