window.onload = () => setup(
   new Config(),
   parseTok,
);

const bed: Entity = {
   ...new iEntity(),
   ...new iPlace(),
   ...new iAgent(),
   descr: () => 'This is a great bed.',
   parent: {} as Entity,
   long: () => 'sina ken lape lon ona.',
   short: () => 'supa lape',
   patterns: [] as ConditionalList<(input: string) => Result>,
}
