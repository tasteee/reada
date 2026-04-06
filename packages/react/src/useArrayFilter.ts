import { reada as readaCore, type WritableStoreT } from "@reada/core";
import { useRef, useSyncExternalStore } from "react";

type PredicateFunctionT<ItemType> = (itemValue: ItemType, itemIndex: number, itemList: ItemType[]) => boolean;

export type UseArrayFilterHookT<ItemType> = (predicateFunction: PredicateFunctionT<ItemType>) => ItemType[];

const checkArrayShallowEqual = <ItemType>(leftItemList: ItemType[], rightItemList: ItemType[]): boolean => {
  const leftLength = leftItemList.length;
  const rightLength = rightItemList.length;
  const hasDifferentLength = leftLength !== rightLength;

  if (hasDifferentLength) {
    return false;
  }

  const hasDifferentValue = leftItemList.some((leftItemValue, itemIndex) => {
    const rightItemValue = rightItemList[itemIndex];
    const isDifferentValue = leftItemValue !== rightItemValue;
    return isDifferentValue;
  });

  const isShallowEqual = !hasDifferentValue;
  return isShallowEqual;
};

export const useArrayFilter = <ItemType>(
  storeValue: WritableStoreT<ItemType[]>,
  predicateFunction: PredicateFunctionT<ItemType>,
): ItemType[] => {
  const previousResultRef = useRef<ItemType[] | undefined>(undefined);
  const hasPreviousResultRef = useRef(false);

  const subscribeToStore = (onStoreChange: () => void): (() => void) => {
    const stopEffect = readaCore.effect([storeValue], () => {
      onStoreChange();
    });

    return stopEffect;
  };

  const getFilteredSnapshot = (): ItemType[] => {
    const stateValue = storeValue.state;
    const nextFilteredList = stateValue.filter((itemValue, itemIndex, itemList) => {
      const isIncluded = predicateFunction(itemValue, itemIndex, itemList);
      return isIncluded;
    });

    const previousFilteredList = previousResultRef.current;
    const hasPreviousResult = hasPreviousResultRef.current;
    const hasPreviousList = hasPreviousResult && typeof previousFilteredList !== "undefined";

    if (hasPreviousList) {
      const isShallowEqual = checkArrayShallowEqual(previousFilteredList, nextFilteredList);

      if (isShallowEqual) {
        return previousFilteredList;
      }
    }

    previousResultRef.current = nextFilteredList;
    hasPreviousResultRef.current = true;

    return nextFilteredList;
  };

  const filteredItemList = useSyncExternalStore(subscribeToStore, getFilteredSnapshot, getFilteredSnapshot);
  return filteredItemList;
};