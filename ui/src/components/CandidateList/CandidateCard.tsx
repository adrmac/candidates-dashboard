import { PauseCircle, PlayCircle } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useRouter } from "next/router";

import Link from "@/components/Link";
import { useData } from "@/context/DataContext";
import { useNowPlaying } from "@/context/NowPlayingContext";
import { Candidate } from "@/types/DataTypes";
import { formatTimestamp } from "@/utils/time";

const tagRegex = [
  "s[0-9]+",
  "srkw",
  "call",
  "whistle",
  "click",
  "j pod",
  "j-pod",
  "k pod",
  "k-pod",
  "l pod",
  "l-pod",
  "biggs",
  "bigg's",
];

export default function CandidateCard(props: {
  candidate: Candidate;
  // index: number;
  // players: MutableRefObject<{ [index: number]: VideoJSPlayer }>;
  // feeds: Feed[];
}) {
  const { nowPlaying, setNowPlaying, masterPlayerRef, masterPlayerStatus } =
    useNowPlaying();

  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const { feeds } = useData();
  const feed = feeds.find(
    (feed) => feed.id === props.candidate.array[0].feedId,
  );

  const image = feed ? feed.imageUrl : "";
  const { descriptions } = props.candidate;
  const tagArray = descriptions.match(new RegExp(tagRegex.join("|"), "gi"));
  const uniqueTags = [...new Set(tagArray)];
  const tagObject: { [key: string]: number | undefined } = {};

  uniqueTags.forEach((tag) => {
    const count = tagArray?.filter((el) => el === tag).length;
    tagObject[tag] = count;
  });

  const candidate = props.candidate;
  const candidateArray = candidate.array;
  const firstCandidate = candidateArray[candidateArray.length - 1]; // firstCandidate is the earliest time, reports are sorted descending
  const lastCandidate = candidateArray[0]; // lastCandidate is the most recent time
  const firstTimestamp = firstCandidate.timestamp;
  const lastTimestamp = lastCandidate.timestamp;
  const allSameTime =
    candidateArray.length > 1 && firstTimestamp === lastTimestamp;
  const firstTimestampString = firstCandidate.timestampString;
  const lastTimestampString = lastCandidate.timestampString;
  const candidateTitle = formatTimestamp(firstCandidate.timestamp);

  // use these to set href on cards
  const router = useRouter();
  const basePath = router.pathname.replace(/\[.*?\]/g, "").replace(/\/$/, ""); // remove the query in [], then remove any trailing slash
  const candidateHref =
    firstTimestamp === lastTimestamp
      ? `${basePath}/${firstTimestampString}`
      : `${basePath}/${firstTimestampString}_${lastTimestampString}`;

  const handlePlay = (candidate: Candidate) => {
    setNowPlaying(candidate);
    masterPlayerRef?.current?.play();
  };

  const handlePause = () => {
    masterPlayerRef?.current?.pause();
  };

  const iconSize = "40px";

  const playIcon = (
    <PlayCircle
      onClick={() => handlePlay(candidate)}
      sx={{
        height: iconSize,
        width: iconSize,
        cursor: "pointer",
        marginRight: "-8px",
      }}
    />
  );

  const pauseIcon = (
    <PauseCircle
      onClick={() => handlePause()}
      sx={{
        height: iconSize,
        width: iconSize,
        cursor: "pointer",
        marginRight: "-8px",
      }}
    />
  );

  return (
    <Card
      key={firstTimestampString}
      sx={{
        display: "flex",
        flexFlow: "row-reverse",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <CardActionArea>
        <CardContent
          sx={{
            display: "flex",
            flexFlow: "column",
            gap: "12px",
            fontSize: smDown ? "14px" : "1rem",
            padding: smDown ? "12px" : "1rem",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Link
              // custom Link component based on NextLink, not MUI Link, is required here to persist layout and avoid page reset
              href={candidateHref}
              style={{
                width: "100%",
                color: "inherit",
                textDecoration: "inherit",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    backgroundImage: `url(${image})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    width: smDown ? "40px" : "60px",
                    height: smDown ? "40px" : "60px",
                    borderRadius: "4px",
                  }}
                ></Box>
                <Stack>
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{ fontWeight: "bold", fontSize: "inherit" }}
                  >
                    {candidateTitle}
                    {/* {new Date(lastTimestamp).toLocaleString()} */}
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "inherit" }}>
                    {candidate.hydrophone}
                    {" • "}
                    {candidate.array.length === 1
                      ? candidate.array[0].type === "human" ||
                        candidate.array[0].type === "sightings"
                        ? "30 seconds"
                        : "1 minute"
                      : Math.round(
                            (Date.parse(lastTimestampString) -
                              Date.parse(firstTimestampString)) /
                              (1000 * 60),
                          ) >= 1
                        ? Math.round(
                            (Date.parse(lastTimestampString) -
                              Date.parse(firstTimestampString)) /
                              (1000 * 60),
                          ) + " minutes"
                        : Math.round(
                            (Date.parse(lastTimestampString) -
                              Date.parse(firstTimestampString)) /
                              (1000 * 60 * 60),
                          ) + " seconds"}
                  </Typography>
                </Stack>
              </Box>
            </Link>
            <Box>
              {candidate.id !== nowPlaying?.id
                ? playIcon
                : masterPlayerStatus !== "playing"
                  ? playIcon
                  : pauseIcon}
            </Box>
          </Box>
          <Link
            // custom Link component based on NextLink, not MUI Link, is required here to persist layout and avoid page reset
            href={candidateHref}
            style={{
              width: "100%",
              color: "inherit",
              textDecoration: "inherit",
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "inherit" }}>
              {["whale", "vessel", "other", "whale (AI)", "sightings"]
                .map((item) =>
                  candidate[item as keyof Candidate]
                    ? candidate[item as keyof Candidate] + "  " + item
                    : null,
                )
                .filter((candidate) => candidate !== null)
                .join(" • ")}
              <span style={{ whiteSpace: "pre" }}>{"  "}</span>
              {candidate.descriptions ? (
                <span style={{ color: "rgba(255,255,255,.75)" }}>
                  {candidate.descriptions}
                </span>
              ) : (
                <br />
              )}
            </Typography>

            {tagArray && (
              <Box
                sx={{
                  display: "flex",
                  gap: "10px",
                  padding: "1rem 0",
                  flexWrap: "wrap",
                }}
              >
                {Object.entries(tagObject).map(([tag]) => (
                  <Chip
                    label={`${tag}`}
                    key={tag}
                    variant="filled"
                    sx={{
                      fontSize: "14px",
                    }}
                  />
                ))}
              </Box>
            )}
          </Link>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
