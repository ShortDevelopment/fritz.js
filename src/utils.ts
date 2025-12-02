/**
 * A decorator to make a class property enumerable.
 *
 * It creates a new property on the instance that shadows the prototype's property.
 * The new property uses the original descriptor but is marked as enumerable.
 */
export const enumerable = <This, Value>(
  original: () => Value,
  context: ClassGetterDecoratorContext<This, Value>,
): void => {
  if (context.kind !== "getter") {
    throw new TypeError(
      `@enumerable can only be applied to getters, but was applied to a ${context.kind}.`,
    );
  }

  context.addInitializer(function () {
    Object.defineProperty(this, context.name, {
      ...(Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        context.name,
      ) ?? {}),
      get: original,
      enumerable: true,
    });
  });
};
