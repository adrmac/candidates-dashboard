import { Box, Typography } from "@mui/material";
import _ from "lodash";
import { Fragment } from "react";

import { TICKER_HEIGHT } from "./SpectrogramTimeline";

const MAX_TICK_WIDTH = 0.3;

export function FrequencyAxisLinearLayer({
  minFrequency,
  maxFrequency,
  zIndex,
}: {
  minFrequency: number;
  maxFrequency: number;
  zIndex: number;
}) {
  const maxScale = Math.ceil(Math.log10(maxFrequency));
  const minScale = maxScale - 2;

  const minTick =
    Math.floor(minFrequency / Math.pow(10, minScale)) * Math.pow(10, minScale);
  const maxTick =
    Math.ceil(maxFrequency / Math.pow(10, minScale)) * Math.pow(10, minScale);

  const ticks = _.range(minTick, maxTick, Math.pow(10, minScale))
    .map((frequency) => {
      const bottom = `${(100 * frequency) / maxTick}%`;
      const minWidth = 0.2;
      const isMajor = frequency % Math.pow(10, minScale) === 0;
      const widthFactor = isMajor ? 1 : 1 - minWidth;

      return { frequency, bottom, widthFactor, isMajor };
    })
    .filter(({ frequency }) => frequency > minTick && frequency <= maxTick);
  return (
    <Box
      data-component="freq"
      sx={{
        zIndex,
        position: "sticky",
        left: "0%",
        bottom: "0",
        width: "50px",
        backgroundColor: "#efefef",
      }}
    >
      <Box
        sx={{
          position: "relative",
          top: TICKER_HEIGHT,
          height: `calc(100% - ${TICKER_HEIGHT}px)`,
        }}
      >
        <Typography
          fontSize={10}
          sx={{ position: "absolute", top: 0, right: "3px" }}
        >
          Hz
        </Typography>
        {ticks.map((tick, idx) => (
          <Fragment key={idx}>
            {tick.isMajor && (
              <Label frequency={tick.frequency} bottom={tick.bottom} />
            )}
            <Tick
              key={idx}
              bottom={tick.bottom}
              widthFactor={tick.widthFactor}
              frequency={tick.frequency}
            />
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}

function Label({ frequency, bottom }: { frequency: number; bottom: string }) {
  const value = frequency >= 1000 ? frequency / 1000 : frequency;
  const label = frequency >= 1000 ? "k" : "";
  return (
    <Box width="45%" sx={{ left: 0, bottom, position: "absolute" }}>
      <Box sx={{ position: "relative" }}>
        <Typography
          fontSize={12}
          sx={{
            marginLeft: "5px",
            position: "absolute",
            bottom: frequency === 1 ? "-3px" : "-8px",
          }}
        >
          {value}
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function Tick({
  frequency,
  bottom,
  widthFactor,
}: {
  frequency: number;
  bottom: string;
  widthFactor: number;
}) {
  return (
    <Box
      data-frequency={frequency}
      width={`${100 * MAX_TICK_WIDTH * widthFactor}%`}
      sx={{
        bottom,
        position: "absolute",
        right: 0,
        borderTop: "1px solid #444",
      }}
    ></Box>
  );
}
