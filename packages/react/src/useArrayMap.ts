import { reada as readaCore, type WritableStoreT } from "@reada/core";
import { useRef, useSyncExternalStore } from "react";

type TransformFunctionT<ItemType, MappedValueType> = (
  itemValue: ItemType,
  itemIndex: number,
  itemList: ItemType[],
) => MappedValueType;

export type UseArrayMapHookT<ItemType> = <MappedValueType>(
  transformFunction: TransformFunctionT<ItemType, MappedValueType>,
) => MappedValueType[];

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

export const useArrayMap = <ItemType, MappedValueType>(
  storeValue: WritableStoreT<ItemType[]>,
  transformFunction: TransformFunctionT<ItemType, MappedValueType>,
): MappedValueType[] => {
  const previousResultRef = useRef<MappedValueType[] | undefined>(undefined);
  const hasPreviousResultRef = useRef(false);

  const subscribeToStore = (onStoreChange: () => void): (() => void) => {
    const stopEffect = readaCore.effect([storeValue], () => {
      onStoreChange();
    });

    return stopEffect;
  };

  const getMappedSnapshot = (): MappedValueType[] => {
    const stateValue = storeValue.state;
    const nextMappedList = stateValue.map((itemValue, itemIndex, itemList) => {
      const mappedValue = transformFunction(itemValue, itemIndex, itemList);
      return mappedValue;
    });

    const previousMappedList = previousResultRef.current;
    const hasPreviousResult = hasPreviousResultRef.current;
    const hasPreviousList = hasPreviousResult && typeof previousMappedList !== "undefined";

    if (hasPreviousList) {
      const isShallowEqual = checkArrayShallowEqual(previousMappedList, nextMappedList);

      if (isShallowEqual) {
        return previousMappedList;
      }
    }

    previousResultRef.current = nextMappedList;
    hasPreviousResultRef.current = true;

    return nextMappedList;
  };

  const mappedItemList = useSyncExternalStore(subscribeToStore, getMappedSnapshot, getMappedSnapshot);
  return mappedItemList;
};