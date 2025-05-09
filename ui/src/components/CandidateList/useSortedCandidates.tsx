import { useMemo } from "react";

import { Candidate, CombinedData } from "@/types/DataTypes";

const countCategories = (arr: { newCategory: string }[], cat: string) => {
  return arr.filter((d) => d.newCategory.toLowerCase() === cat).length;
};
const cleanSightingsDescription = (description: string | null | undefined) => {
  if (!description) return;
  const removeBracket = description.replace(/^\[[^\]]*\]\s*/, "");
  const removeBreak = removeBracket.replace(/<br>[^•]*/g, "");
  const removeLinks = removeBreak
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+•/g, " •")
    .trim();

  return removeLinks.trim();
};

const createCandidates = (
  dataset: CombinedData[],
  interval: number,
): Candidate[] => {
  const candidates: Array<Array<CombinedData>> = [];
  // sorting reports in ascending order from earliest to latest
  const sort = [...dataset].sort(
    (a, b) => Date.parse(a.timestampString) - Date.parse(b.timestampString),
  );
  sort.forEach((el: CombinedData) => {
    if (!candidates.length) {
      const firstArray = [];
      firstArray.push(el);
      candidates.push(firstArray);
    } else {
      const hydrophone = el.hydrophone;
      const findLastMatchingArray = () => {
        for (let i = candidates.length - 1; i >= 0; i--) {
          if (candidates[i][0].hydrophone === hydrophone) {
            return candidates[i];
          }
        }
      };
      const lastMatchingArray = findLastMatchingArray();
      const lastTimestamp =
        lastMatchingArray &&
        lastMatchingArray[lastMatchingArray.length - 1].timestampString;
      if (
        lastTimestamp &&
        Math.abs(Date.parse(lastTimestamp) - Date.parse(el.timestampString)) /
          (1000 * 60) <=
          interval
      ) {
        lastMatchingArray.push(el);
      } else {
        const newArray = [];
        newArray.push(el);
        candidates.push(newArray);
      }
    }
  });

  const candidatesMap = candidates.map((candidate) => {
    return {
      id: `${candidate[0].timestampString}_${candidate[candidate.length - 1].timestampString}`,
      array: candidate,
      whale: countCategories(candidate, "whale"),
      vessel: countCategories(candidate, "vessel"),
      other: countCategories(candidate, "other"),
      "whale (AI)": countCategories(candidate, "whale (ai)"),
      sightings: countCategories(candidate, "sightings"),
      hydrophone: candidate[0].hydrophone,
      descriptions: candidate
        .map((el: CombinedData) => cleanSightingsDescription(el.comments))
        .filter((el: string | null | undefined) => el !== null)
        .join(" • ")
        .replace(/•\s?$/, "") // removes any trailing bullets from empty space comments
        .replace(/^\s?•\s?/, ""), // removes any forward bullets from empty space comments
    };
  });

  return candidatesMap;
};

const sortCandidates = (candidates: Candidate[], sortOrder: string) => {
  const handledGetTime = (date?: Date) => {
    return date != null ? new Date(date).getTime() : 0;
  };

  const sortDescending = (array: Candidate[]) => {
    const sort = array.sort(
      (a, b) =>
        handledGetTime(b.array[0].timestamp) -
        handledGetTime(a.array[0].timestamp),
    );
    return sort;
  };

  const sortAscending = (array: Candidate[]) => {
    const sort = array.sort(
      (a, b) =>
        handledGetTime(a.array[0].timestamp) -
        handledGetTime(b.array[0].timestamp),
    );
    return sort;
  };
  const sorted =
    sortOrder === "desc"
      ? sortDescending([...candidates])
      : sortAscending([...candidates]);
  return sorted;
};

export function useSortedCandidates(
  rawData: CombinedData[],
  timeIncrement: number,
  sortOrder: string,
): Candidate[] {
  return useMemo(() => {
    const created = createCandidates(rawData, timeIncrement);
    const sorted = sortCandidates(created, sortOrder);
    return sorted;
  }, [rawData, timeIncrement, sortOrder]);
}
