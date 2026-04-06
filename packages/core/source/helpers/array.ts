type ArrayWriteInputT<ItemType> = ItemType[] | ((stateValue: ItemType[]) => ItemType[]);

export type ArrayWriteT<ItemType> = (nextStateOrUpdater: ArrayWriteInputT<ItemType>) => void | Promise<void>;

export type ArrayHelpersT<ItemType> = {
  append: (itemValue: ItemType) => void;
  prepend: (itemValue: ItemType) => void;
  remove: (predicateFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => boolean) => void;
  filter: (predicateFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => boolean) => void;
  map: (transformFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => ItemType) => void;
};

export const getArrayHelpers = <ItemType>(writeArrayState: ArrayWriteT<ItemType>): ArrayHelpersT<ItemType> => {
  const append = (itemValue: ItemType): void => {
    writeArrayState((stateValue) => {
      const nextStateValue = [...stateValue, itemValue];
      return nextStateValue;
    });
  };

  const prepend = (itemValue: ItemType): void => {
    writeArrayState((stateValue) => {
      const nextStateValue = [itemValue, ...stateValue];
      return nextStateValue;
    });
  };

  const remove = (
    predicateFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => boolean,
  ): void => {
    writeArrayState((stateValue) => {
      const nextStateValue = stateValue.filter((itemValue, itemIndex, itemList) => {
        const isItemMatchingPredicate = predicateFunction(itemValue, itemIndex, itemList);
        const isItemKept = !isItemMatchingPredicate;
        return isItemKept;
      });

      return nextStateValue;
    });
  };

  const filter = (
    predicateFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => boolean,
  ): void => {
    writeArrayState((stateValue) => {
      const nextStateValue = stateValue.filter((itemValue, itemIndex, itemList) => {
        const isItemIncluded = predicateFunction(itemValue, itemIndex, itemList);
        return isItemIncluded;
      });

      return nextStateValue;
    });
  };

  const map = (transformFunction: (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => ItemType): void => {
    writeArrayState((stateValue) => {
      const nextStateValue = stateValue.map((itemValue, itemIndex, itemList) => {
        const transformedItemValue = transformFunction(itemValue, itemIndex, itemList);
        return transformedItemValue;
      });

      return nextStateValue;
    });
  };

  return {
    append,
    prepend,
    remove,
    filter,
    map,
  };
};