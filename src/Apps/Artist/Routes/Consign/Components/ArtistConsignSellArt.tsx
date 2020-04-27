import React from "react"
import { createFragmentContainer, graphql } from "react-relay"

import { ArtistConsignSellArt_artist } from "__generated__/ArtistConsignSellArt_artist.graphql"

import { Box, Button, Sans, Serif } from "@artsy/palette"
import { AnalyticsSchema } from "Artsy"
import { RouterLink } from "Artsy/Router/RouterLink"
import { LightPurpleColor, SectionContainer } from "./SectionContainer"
import { getConsignSubmissionUrl } from "./Utils/getConsignSubmissionUrl"

interface ArtistConsignSellArtProps {
  artist: ArtistConsignSellArt_artist
}

const ArtistConsignSellArt: React.FC<ArtistConsignSellArtProps> = ({
  artist,
}) => {
  return (
    <SectionContainer background={LightPurpleColor}>
      <Box textAlign="center">
        <Box>
          <Serif element="h2" size={["10", "12"]}>
            Sell Art <br />
            From Your Collection
          </Serif>
        </Box>

        <Box mt={3} mb={4}>
          <Sans size="4t">With Artsy's expert guidance, selling is simple</Sans>
        </Box>

        <Box>
          <RouterLink
            to={getConsignSubmissionUrl({
              contextPath: artist.href,
              subject: AnalyticsSchema.Subject.RequestPriceEstimate,
            })}
          >
            <Button>Request a price estimate</Button>
          </RouterLink>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export const ArtistConsignSellArtFragmentContainer = createFragmentContainer(
  ArtistConsignSellArt,
  {
    artist: graphql`
      fragment ArtistConsignSellArt_artist on Artist {
        href
      }
    `,
  }
)
