import { Box, Typography } from "@mui/material";
import { differenceInSeconds } from "date-fns";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";

import { Feed, FeedStream } from "@/graphql/generated";
import { getHlsURI } from "@/hooks/useTimestampFetcher";

import { type PlayerStatus } from "./Player";
import PlayPauseButton from "./PlayPauseButton";
import { type VideoJSPlayer } from "./VideoJS";

const VideoJS = dynamic(() => import("./VideoJS"));

const playerOffsetToDateTime = (playlistDatetime: Date, playerOffset: number) =>
  new Date(playlistDatetime.valueOf() + playerOffset * 1000);

export function BoutPlayer({
  feed,
  feedStream,
  targetTime,
  onPlayerTimeUpdate,
}: {
  feed: Pick<Feed, "bucket" | "nodeName">;
  feedStream: Pick<FeedStream, "bucket" | "playlistTimestamp">;
  targetTime: Date;
  onPlayerTimeUpdate?: (time: Date) => void;
}) {
  const hlsURI = getHlsURI(
    feed.bucket,
    feed.nodeName,
    Number(feedStream.playlistTimestamp),
  );
  const playlistTimestamp = feedStream.playlistTimestamp;
  const playlistDatetime = useMemo(
    () => new Date(Number(playlistTimestamp) * 1000),
    [playlistTimestamp],
  );

  const now = useMemo(() => new Date(), []);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("idle");
  const playerRef = useRef<VideoJSPlayer | null>(null);
  const targetOffset = useMemo(
    () => differenceInSeconds(targetTime, playlistDatetime),
    [targetTime, playlistDatetime],
  );
  const [playerOffset, setPlayerOffset] = useState<number>(
    targetOffset ?? now.valueOf() / 1000 - Number(playlistTimestamp),
  );
  const playerDateTime = useMemo(
    () => playerOffsetToDateTime(playlistDatetime, playerOffset),
    [playlistDatetime, playerOffset],
  );

  const intervalRef = useRef<NodeJS.Timeout>();

  const playerOptions = useMemo(
    () => ({
      autoplay: false,
      flash: {
        hls: {
          overrideNative: true,
        },
      },
      html5: {
        hls: {
          overrideNative: true,
        },
      },
      sources: [
        {
          // If hlsURI isn't set, use a dummy URI to trigger an error
          // The dummy URI doesn't actually exist, it should return 404
          // This is the only way to get videojs to throw an error, otherwise
          // it just won't initialize (if src is undefined/null/empty))
          src: hlsURI,
          type: "application/x-mpegurl",
        },
      ],
    }),
    [hlsURI],
  );

  const handleReady = useCallback(
    (player: VideoJSPlayer) => {
      playerRef.current = player;

      player.on("playing", () => {
        setPlayerStatus("playing");
        // 'ontimeupdate' is slow, so we update a ref with a short
        // interval for faster updates
        // https://github.com/videojs/video.js/issues/4322
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          const currentTime = player.currentTime() ?? targetOffset ?? 0;
          const playerDateTime = playerOffsetToDateTime(
            playlistDatetime,
            currentTime,
          );
          if (onPlayerTimeUpdate !== undefined) {
            onPlayerTimeUpdate(playerDateTime);
          }
        }, 10);
      });
      player.on("pause", () => {
        setPlayerStatus("paused");
        clearInterval(intervalRef.current);
      });
      player.on("waiting", () => setPlayerStatus("loading"));
      player.on("error", () => setPlayerStatus("error"));

      player.on("timeupdate", () => {
        const currentTime = player.currentTime() ?? targetOffset ?? 0;
        setPlayerOffset(currentTime);
      });

      player.on("loadedmetadata", () => {
        // On initial load, set player time to target time
        player.currentTime(targetOffset);
      });
    },
    [onPlayerTimeUpdate, playlistDatetime, targetOffset, intervalRef],
  );
  const handlePlayPauseClick = () => {
    const player = playerRef.current;

    if (playerStatus === "error") {
      setPlayerStatus("idle");
      return;
    }

    if (!player) {
      setPlayerStatus("error");
      return;
    }

    try {
      if (playerStatus === "loading" || playerStatus === "playing") {
        player.pause();
      } else {
        player.play();
      }
    } catch (e) {
      console.error(e);
      // AbortError is thrown if pause() is called while play() is still loading (e.g. if segments are 404ing)
      // It's not important, so don't show this error to the user
      if (e instanceof DOMException && e.name === "AbortError") return;
      setPlayerStatus("error");
    }
  };
  return (
    <div>
      <Box display="none">
        <VideoJS options={playerOptions} onReady={handleReady} />
      </Box>
      <Box ml={2} mr={6} display="flex" justifyContent="center">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Box mb={1}>
            <PlayPauseButton
              playerStatus={playerStatus}
              onClick={handlePlayPauseClick}
              disabled={false}
            />
          </Box>
          <Typography variant="body1" fontWeight={"bold"}>
            {playerDateTime !== undefined &&
              playerDateTime.toLocaleTimeString()}
          </Typography>
          <Typography variant="subtitle2">
            {playerDateTime !== undefined &&
              playerDateTime.toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    </div>
  );
}
