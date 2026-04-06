type ObjectWriteInputT<ObjectStateType extends Record<string, unknown>> =
  | ObjectStateType
  | ((stateValue: ObjectStateType) => ObjectStateType);

export type ObjectWriteT<ObjectStateType extends Record<string, unknown>> = (
  nextStateOrUpdater: ObjectWriteInputT<ObjectStateType>,
) => void | Promise<void>;

type CurriedPathSetterT = (nextStateValue: unknown) => void;

type AtHelperT = {
  (pathValue: string): CurriedPathSetterT;
  (pathValue: string, nextStateValue: unknown): void;
};

type ShallowPatchT<ObjectStateType extends Record<string, unknown>> = Partial<Record<keyof ObjectStateType, unknown>>;

export type ObjectHelpersT<ObjectStateType extends Record<string, unknown>> = {
  patch: (partialStateValue: ShallowPatchT<ObjectStateType>) => void;
  at: AtHelperT;
};

const checkIsPathIndex = (segmentValue: string): boolean => {
  const isPathIndex = /^\d+$/.test(segmentValue);
  return isPathIndex;
};

const getPathSegmentList = (pathValue: string): string[] => {
  const splitSegmentList = pathValue.split(".");
  const pathSegmentList = splitSegmentList.filter((segmentValue) => {
    const isSegmentDefined = segmentValue.length > 0;
    return isSegmentDefined;
  });

  return pathSegmentList;
};

const getDefaultContainerForNextSegment = (nextSegmentValue: string | undefined): unknown => {
  const isNextSegmentIndex = typeof nextSegmentValue === "string" && checkIsPathIndex(nextSegmentValue);

  if (isNextSegmentIndex) {
    return [];
  }

  return {};
};

// This recursively rebuilds only the path branch, preserving immutability.
const rebuildPathBranch = (currentNodeValue: unknown, pathSegmentList: string[], nextStateValue: unknown): unknown => {
  const currentSegmentValue = pathSegmentList[0];
  const remainingPathSegmentList = pathSegmentList.slice(1);
  const isLeafSegment = remainingPathSegmentList.length === 0;
  const isSegmentMissing = typeof currentSegmentValue === "undefined";

  if (isSegmentMissing) {
    return nextStateValue;
  }

  const isCurrentNodeArray = Array.isArray(currentNodeValue);

  if (isCurrentNodeArray) {
    const arrayNodeValue = currentNodeValue;
    const arrayNodeClone = [...arrayNodeValue];
    const currentIndex = Number(currentSegmentValue);
    const currentChildValue = arrayNodeClone[currentIndex];
    const shouldCreateChildContainer = typeof currentChildValue === "undefined" && !isLeafSegment;
    const defaultChildContainer = getDefaultContainerForNextSegment(remainingPathSegmentList[0]);
    const childBaseValue = shouldCreateChildContainer ? defaultChildContainer : currentChildValue;
    const nextChildValue = isLeafSegment
      ? nextStateValue
      : rebuildPathBranch(childBaseValue, remainingPathSegmentList, nextStateValue);

    arrayNodeClone[currentIndex] = nextChildValue;

    return arrayNodeClone;
  }

  const isCurrentNodeObject = typeof currentNodeValue === "object" && currentNodeValue !== null;
  const objectNodeValue = isCurrentNodeObject ? (currentNodeValue as Record<string, unknown>) : {};
  const objectNodeClone: Record<string, unknown> = { ...objectNodeValue };
  const currentChildValue = objectNodeClone[currentSegmentValue];
  const shouldCreateChildContainer = typeof currentChildValue === "undefined" && !isLeafSegment;
  const defaultChildContainer = getDefaultContainerForNextSegment(remainingPathSegmentList[0]);
  const childBaseValue = shouldCreateChildContainer ? defaultChildContainer : currentChildValue;
  const nextChildValue = isLeafSegment
    ? nextStateValue
    : rebuildPathBranch(childBaseValue, remainingPathSegmentList, nextStateValue);

  objectNodeClone[currentSegmentValue] = nextChildValue;

  return objectNodeClone;
};

const applyValueAtPath = <ObjectStateType extends Record<string, unknown>>(
  stateValue: ObjectStateType,
  pathValue: string,
  nextStateValue: unknown,
): ObjectStateType => {
  const pathSegmentList = getPathSegmentList(pathValue);
  const isPathEmpty = pathSegmentList.length === 0;

  if (isPathEmpty) {
    return stateValue;
  }

  const nextObjectStateValue = rebuildPathBranch(stateValue, pathSegmentList, nextStateValue) as ObjectStateType;
  return nextObjectStateValue;
};

export const getObjectHelpers = <ObjectStateType extends Record<string, unknown>>(
  writeObjectState: ObjectWriteT<ObjectStateType>,
): ObjectHelpersT<ObjectStateType> => {
  const patch = (partialStateValue: ShallowPatchT<ObjectStateType>): void => {
    writeObjectState((stateValue) => {
      const nextStateValue = Object.assign({}, stateValue, partialStateValue);
      const nextObjectStateValue = nextStateValue as ObjectStateType;
      return nextObjectStateValue;
    });
  };

  const at = ((pathValue: string, ...valueList: [unknown?]): void | CurriedPathSetterT => {
    const isCurriedCall = valueList.length === 0;

    if (isCurriedCall) {
      const setValueAtPath = (nextStateValue: unknown): void => {
        writeObjectState((stateValue) => {
          const nextObjectStateValue = applyValueAtPath(stateValue, pathValue, nextStateValue);
          return nextObjectStateValue;
        });
      };

      return setValueAtPath;
    }

    const nextStateValue = valueList[0];

    writeObjectState((stateValue) => {
      const nextObjectStateValue = applyValueAtPath(stateValue, pathValue, nextStateValue);
      return nextObjectStateValue;
    });
  }) as AtHelperT;

  return {
    patch,
    at,
  };
};