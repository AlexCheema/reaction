import { Image } from "@artsy/palette"
import { DefaultHeaderArtwork_artwork } from "__generated__/DefaultHeaderArtwork_artwork.graphql"
import { AnalyticsSchema } from "Artsy/Analytics"
import { useTracking } from "Artsy/Analytics/useTracking"
import { RouterLink } from "Artsy/Router/RouterLink"
import React from "react"
import { createFragmentContainer, graphql } from "react-relay"
import styled from "styled-components"

const Link = styled(RouterLink)`
  display: flex;
  align-items: flex-end;
`

export type DefaultHeaderArtworkProps = React.HTMLAttributes<
  HTMLAnchorElement
> & {
  artwork: DefaultHeaderArtwork_artwork
  small?: boolean
  collectionId: string
  collectionSlug: string
}

export const DefaultHeaderArtwork: React.FC<DefaultHeaderArtworkProps> = ({
  artwork,
  small = false,
  collectionId,
  collectionSlug,
  ...rest
}) => {
  const { trackEvent } = useTracking()

  if (!artwork.node.image) return null

  const handleClick = () => {
    trackEvent({
      action_type: AnalyticsSchema.ActionType.Click,
      context_module: AnalyticsSchema.ContextModule.ArtworkBanner,
      context_page_owner_type: AnalyticsSchema.OwnerType.Collection,
      context_page: AnalyticsSchema.PageName.CollectionPage,
      context_page_owner_id: collectionId,
      context_page_owner_slug: collectionSlug,
      destination_path: artwork.node.href,
    })
  }

  return (
    <Link
      to={artwork.node.href}
      key={artwork.node.href}
      onClick={handleClick}
      {...rest}
    >
      <Image
        width={artwork.node.image[small ? "small" : "large"].width}
        height={artwork.node.image[small ? "small" : "large"].height}
        src={artwork.node.image[small ? "small" : "large"].url}
        preventRightClick
        mr={1}
      />
    </Link>
  )
}

export const DefaultHeaderArtworkFragmentContainer = createFragmentContainer(
  DefaultHeaderArtwork,
  {
    artwork: graphql`
      fragment DefaultHeaderArtwork_artwork on FilterArtworksEdge {
        node {
          id
          href
          slug
          image {
            large: resized(height: 230) {
              url
              width
              height
            }
            small: resized(height: 160) {
              url
              width
              height
            }
          }
        }
      }
    `,
  }
)
