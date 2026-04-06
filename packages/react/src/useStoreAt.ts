import type { WritableStoreT } from "@reada/core";
import { useStore } from "./useStore.ts";

type CurriedPathValueT<PathType extends string, ObjectStateType extends Record<string, unknown>> =
  PathType extends keyof ObjectStateType
    ? ObjectStateType[PathType]
    : unknown;

export type UseStoreAtHookT<ObjectStateType extends Record<string, unknown>> = {
  <PathType extends string>(pathValue: PathType): CurriedPathValueT<PathType, ObjectStateType>;
};

const checkSegmentIsIndex = (segmentValue: string): boolean => {
  const isIndexSegment = /^\d+$/.test(segmentValue);
  return isIndexSegment;
};

const getPathSegmentList = (pathValue: string): string[] => {
  const splitSegmentList = pathValue.split(".");
  const pathSegmentList = splitSegmentList.filter((segmentValue) => {
    const isSegmentDefined = segmentValue.length > 0;
    return isSegmentDefined;
  });

  return pathSegmentList;
};

// This resolves dot paths and index segments against nested object state.
const getValueAtPath = (stateValue: unknown, pathValue: string): unknown => {
  const pathSegmentList = getPathSegmentList(pathValue);

  const valueAtPath = pathSegmentList.reduce<unknown>((currentValue, segmentValue) => {
    const isCurrentUndefined = typeof currentValue === "undefined";
    const isCurrentNull = currentValue === null;
    const isCurrentMissing = isCurrentUndefined || isCurrentNull;

    if (isCurrentMissing) {
      return undefined;
    }

    const isCurrentArray = Array.isArray(currentValue);
    const isSegmentIndex = checkSegmentIsIndex(segmentValue);

    if (isCurrentArray && isSegmentIndex) {
      const arrayValue = currentValue;
      const itemIndex = Number(segmentValue);
      const itemValue = arrayValue[itemIndex];
      return itemValue;
    }

    const isCurrentObject = typeof currentValue === "object";

    if (isCurrentObject) {
      const objectValue = currentValue as Record<string, unknown>;
      const nestedValue = objectValue[segmentValue];
      return nestedValue;
    }

    return undefined;
  }, stateValue);

  return valueAtPath;
};

export const useStoreAt = <ObjectStateType extends Record<string, unknown>, PathType extends string>(
  storeValue: WritableStoreT<ObjectStateType>,
  pathValue: PathType,
): CurriedPathValueT<PathType, ObjectStateType> => {
  const selectedPathValue = useStore(storeValue, (stateValue) => {
    const pathStateValue = getValueAtPath(stateValue, pathValue) as CurriedPathValueT<PathType, ObjectStateType>;
    return pathStateValue;
  });

  return selectedPathValue;
};