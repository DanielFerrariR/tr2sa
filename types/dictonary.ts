export type Dictionary<Key extends string | number | symbol, Value> = {
  [key in Key]: Value;
};
