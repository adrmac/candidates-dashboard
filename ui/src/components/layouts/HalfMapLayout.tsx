import { Earbuds, Mic } from "@mui/icons-material";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Theme,
  useMediaQuery,
} from "@mui/material";
import { type Map as LeafletMap } from "leaflet";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Header from "@/components/Header";
import { useData } from "@/context/DataContext";
import { LayoutContext } from "@/context/LayoutContext";
import { useNowPlaying } from "@/context/NowPlayingContext";

import { useComputedPlaybackFields } from "../../hooks/useComputedPlaybackFields";
import CandidatesTabs from "../CandidateList/CandidatesTabs";
import {
  CandidatesStack,
  VisualizationsStack,
} from "../CandidateList/CandidatesTabs";
import PlayerTimeDisplay from "../CandidateList/PlayerTimeDisplay";
import PlayBar from "../PlayBar";
import { MasterDataLayout } from "./MasterDataLayout";

const MapWithNoSSR = dynamic(() => import("@/components/NewMap"), {
  ssr: false,
});

function HalfMapLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { nowPlaying } = useNowPlaying();
  const { feeds } = useData();
  console.log("rendering halfmap");

  const nowPlayingFeed = useMemo(() => {
    if (!nowPlaying) return undefined;
    return feeds.find((feed) => feed.id === nowPlaying.feedId);
  }, [nowPlaying, feeds]);

  const { startOffset } = useComputedPlaybackFields(nowPlaying);

  const masterPlayerTimeRef = useRef(0);
  // const [masterPlayerTime, setMasterPlayerTime] = useState(0);

  const [menuTab, setMenuTab] = useState(0);
  const menu = (
    <BottomNavigation
      showLabels
      value={menuTab}
      onChange={(event, newMenuTab) => {
        setMenuTab(newMenuTab);
      }}
      sx={{ height: "69px" }}
    >
      <BottomNavigationAction label="Recordings" icon={<Earbuds />} />
      <BottomNavigationAction label="Listen Live" icon={<Mic />} />
    </BottomNavigation>
  );

  type MobileContainerProps = {
    children: React.ReactNode;
  };

  const MobileContainer = ({ children }: MobileContainerProps) => {
    return (
      <Container
        maxWidth="xl"
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {children}
      </Container>
    );
  };

  const mapTitle = (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        left: 16,
        width: smDown ? "250px" : "300px",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <PlayerTimeDisplay
        nowPlaying={nowPlaying}
        masterPlayerTimeRef={masterPlayerTimeRef}
        startOffset={startOffset}
      />
    </Box>
  );

  const [map, setMap] = useState<LeafletMap>();
  // const feeds = useFeedsQuery().data?.feeds ?? [];
  const firstOnlineFeed = feeds.filter(({ online }) => online)[0];
  const currentFeed = useMemo(() => {
    return nowPlayingFeed ? nowPlayingFeed : firstOnlineFeed;
  }, [nowPlayingFeed, firstOnlineFeed]);
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event: React.MouseEvent<HTMLDivElement>) => {
    setTabValue(Number(event.currentTarget.id));
  };

  // update the currentFeed only if there's a new feed
  useEffect(() => {
    if (nowPlayingFeed) {
      map?.setZoom(12);
    } else {
      map?.setZoom(8);
    }
  }, [map, currentFeed, firstOnlineFeed, nowPlaying, nowPlayingFeed]);

  useEffect(() => {
    if (nowPlayingFeed) {
      map?.panTo(nowPlayingFeed.latLng);
    }
  }, [nowPlayingFeed, map]);

  const mapBox = (
    <Box sx={{ flexGrow: 1 }}>
      {mapTitle}
      <MapWithNoSSR
        setMap={setMap}
        currentFeed={nowPlayingFeed}
        feeds={feeds}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        // use `dvh` for dynamic viewport height to handle mobile browser weirdness
        // but fallback to `vh` for browsers that don't support `dvh`
        // `&` is a workaround because sx prop can't have identical keys
        // "&": {
        //   height: "100dvh",
        // },
        height: "100vh",
        paddingBottom: smDown ? "155px" : "80px",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          display: "flex",
          flexFlow: mdDown ? "column" : "row",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!mdDown && (
          <Box
            className="side-list"
            sx={{
              borderRightColor: "divider",
              borderRightStyle: "solid",
              borderRightWidth: 1,
              width: "45%",
              overflow: "auto",
            }}
          >
            <CandidatesTabs />
          </Box>
        )}
        <Box
          sx={{
            minHeight: "44px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {/* // mobile tabs */}
          {mdDown && menuTab === 0 && (
            <>
              <Box id="0" onClick={handleChange}>
                Map
              </Box>
              <Box id="1" onClick={handleChange}>
                Candidates
              </Box>
              <Box id="2" onClick={handleChange}>
                Visualizations
              </Box>
            </>
          )}
          {mdDown && menuTab === 1 && (
            <>
              <Box id="0" onClick={handleChange}>
                Hydrophones
              </Box>
              <Box id="1" onClick={handleChange}>
                Map
              </Box>
            </>
          )}
        </Box>
        <Box
          className="main-panel"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            position: "relative",
            height: "100%",
            overflow: "scroll",
          }}
        >
          {
            // desktop index page, show map
            !mdDown && router.query.candidateId === undefined ? (
              mapBox
            ) : mdDown &&
              router.query.candidateId === undefined &&
              menuTab === 0 ? (
              tabValue === 0 ? (
                mapBox
              ) : tabValue === 1 ? (
                <MobileContainer>
                  <CandidatesStack />
                </MobileContainer>
              ) : (
                <MobileContainer>
                  <VisualizationsStack />
                </MobileContainer>
              )
            ) : mdDown &&
              router.query.candidateId === undefined &&
              menuTab === 1 ? (
              tabValue === 1 ? (
                mapBox
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  hydrophone list
                </div>
              )
            ) : (
              // detail page content, mobile or desktop
              children
            )
          }
        </Box>
      </Box>
      <PlayBar mobileMenu={menu} masterPlayerTimeRef={masterPlayerTimeRef} />
    </Box>
  );
}

export function getHalfMapLayout(page: ReactElement) {
  return (
    <MasterDataLayout>
      <LayoutContext.Provider value="halfMap">
        <HalfMapLayout>{page}</HalfMapLayout>
      </LayoutContext.Provider>
    </MasterDataLayout>
  );
}
